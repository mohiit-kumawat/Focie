"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  startStudySession,
  pauseStudySession,
  resumeStudySession,
  stopStudySession,
  getActiveStudySession,
} from "@/app/actions/session";
import { soundEngine } from "@/lib/audio/chime";
import type { StudySession, SessionMode } from "@/types/database";

export interface UseStudyTimerOptions {
  onSessionComplete?: (session: StudySession) => void;
}

type TimerBroadcastMessage =
  | { type: "SESSION_STARTED"; session: StudySession }
  | { type: "SESSION_PAUSED"; session: StudySession }
  | { type: "SESSION_RESUMED"; session: StudySession }
  | { type: "SESSION_STOPPED"; session: StudySession };

export function useStudyTimer(options?: UseStudyTimerOptions) {
  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Time tracking
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const activeSegmentStartRef = useRef<number | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const hasChimedTargetRef = useRef<boolean>(false);
  const autoCompletingRef = useRef<boolean>(false);
  const sessionRef = useRef<StudySession | null>(session);
  sessionRef.current = session;

  // Helper: Format seconds to MM:SS or HH:MM:SS
  const formatTime = (totalSeconds: number): string => {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Sync elapsed time from authoritative timestamps with ceiling clamping for Pomodoro
  const syncElapsedSeconds = useCallback(() => {
    if (!session) {
      setElapsedSeconds(0);
      return;
    }

    const baseAccumulated = session.accumulated_seconds || 0;

    let total = baseAccumulated;
    if (session.state === "active" && activeSegmentStartRef.current) {
      const nowMs = Date.now();
      const currentSegmentSec = Math.max(
        0,
        Math.floor((nowMs - activeSegmentStartRef.current) / 1000)
      );
      total = baseAccumulated + currentSegmentSec;
    }

    if (session.mode === "pomodoro") {
      const targetSec = (session.target_minutes || 25) * 60;
      setElapsedSeconds(Math.min(targetSec, total));
    } else {
      setElapsedSeconds(total);
    }
  }, [session]);

  // Cross-Tab Broadcast Channel Sync
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    const channel = new BroadcastChannel("focie-timer-sync");
    broadcastChannelRef.current = channel;

    channel.onmessage = (event: MessageEvent<TimerBroadcastMessage>) => {
      const data = event.data;
      if (!data) return;

      if (data.type === "SESSION_STARTED" || data.type === "SESSION_RESUMED") {
        setSession(data.session);
        activeSegmentStartRef.current = Date.now();
        hasChimedTargetRef.current = false;
        autoCompletingRef.current = false;
      } else if (data.type === "SESSION_PAUSED") {
        setSession(data.session);
        activeSegmentStartRef.current = null;
        setElapsedSeconds(data.session.accumulated_seconds);
      } else if (data.type === "SESSION_STOPPED") {
        setSession(null);
        activeSegmentStartRef.current = null;
        setElapsedSeconds(0);
        autoCompletingRef.current = false;
        options?.onSessionComplete?.(data.session);
      }
    };

    return () => {
      channel.close();
      broadcastChannelRef.current = null;
    };
  }, [options]);

  // Load active session from server on mount
  useEffect(() => {
    let isMounted = true;

    async function loadActiveSession() {
      try {
        setLoading(true);
        const active = await getActiveStudySession();
        if (!isMounted) return;

        if (active) {
          setSession(active);
          if (active.state === "active") {
            const startTimestamp = new Date(
              active.paused_at ? active.updated_at : active.started_at
            ).getTime();
            activeSegmentStartRef.current = startTimestamp;
          }
        }
      } catch (err: unknown) {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load session");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadActiveSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Timer interval loop (1 second tick)
  useEffect(() => {
    if (!session || session.state !== "active") return;

    const tick = () => syncElapsedSeconds();
    const immediateTimer = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);

    // Sync on tab visibility change to correct any browser throttling
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(immediateTimer);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session, syncElapsedSeconds]);

  const stop = useCallback(
    async (notes?: string) => {
      const currentSession = sessionRef.current;
      if (!currentSession) return;
      setActionLoading(true);
      setError(null);
      try {
        const result = await stopStudySession(currentSession.id, notes);
        if (!result.success || !result.session) {
          setError(result.error || "Failed to stop session");
          return;
        }
        activeSegmentStartRef.current = null;
        autoCompletingRef.current = false;
        const finished = result.session;
        setSession(null);
        setElapsedSeconds(0);
        soundEngine.playCompletionChime();
        broadcastChannelRef.current?.postMessage({
          type: "SESSION_STOPPED",
          session: finished,
        });
        options?.onSessionComplete?.(finished);
        return finished;
      } catch {
        setError("Failed to stop session.");
      } finally {
        setActionLoading(false);
      }
    },
    [options]
  );

  // Pomodoro target reach chime and automatic auto-completion
  useEffect(() => {
    if (!session || session.mode !== "pomodoro" || session.state !== "active") {
      autoCompletingRef.current = false;
      return;
    }
    const targetTotalSec = (session.target_minutes || 25) * 60;
    if (elapsedSeconds >= targetTotalSec) {
      if (!hasChimedTargetRef.current) {
        hasChimedTargetRef.current = true;
        soundEngine.playCompletionChime();
      }

      if (!autoCompletingRef.current) {
        autoCompletingRef.current = true;
        stop();
      }
    }
  }, [session, elapsedSeconds, stop]);

  // Actions
  const start = async (mode: SessionMode = "pomodoro", targetMinutes: number = 25, subject: string = "General Study") => {
    setActionLoading(true);
    setError(null);
    try {
      const result = await startStudySession({
        mode,
        target_minutes: targetMinutes,
        subject_tag: subject,
      });

      if (!result.success || !result.session) {
        setError(result.error || "Failed to start session");
        return;
      }

      activeSegmentStartRef.current = Date.now();
      hasChimedTargetRef.current = false;
      autoCompletingRef.current = false;
      setSession(result.session);
      setElapsedSeconds(0);
      soundEngine.playStartChime();
      broadcastChannelRef.current?.postMessage({
        type: "SESSION_STARTED",
        session: result.session,
      });
    } catch {
      setError("An unexpected error occurred while starting the session.");
    } finally {
      setActionLoading(false);
    }
  };

  const pause = async () => {
    if (!session) return;
    setActionLoading(true);
    setError(null);
    try {
      const result = await pauseStudySession(session.id);
      if (!result.success || !result.session) {
        setError(result.error || "Failed to pause session");
        return;
      }
      activeSegmentStartRef.current = null;
      setSession(result.session);
      setElapsedSeconds(result.session.accumulated_seconds);
      broadcastChannelRef.current?.postMessage({
        type: "SESSION_PAUSED",
        session: result.session,
      });
    } catch {
      setError("Failed to pause session.");
    } finally {
      setActionLoading(false);
    }
  };

  const resume = async () => {
    if (!session) return;
    setActionLoading(true);
    setError(null);
    try {
      const result = await resumeStudySession(session.id);
      if (!result.success || !result.session) {
        setError(result.error || "Failed to resume session");
        return;
      }
      activeSegmentStartRef.current = Date.now();
      autoCompletingRef.current = false;
      setSession(result.session);
      soundEngine.playStartChime(0.15);
      broadcastChannelRef.current?.postMessage({
        type: "SESSION_RESUMED",
        session: result.session,
      });
    } catch {
      setError("Failed to resume session.");
    } finally {
      setActionLoading(false);
    }
  };

  // Calculations for UI display
  const isPomodoro = session?.mode === "pomodoro";
  const targetTotalSec = (session?.target_minutes || 25) * 60;
  const remainingSeconds = Math.max(0, targetTotalSec - elapsedSeconds);
  const displaySeconds = isPomodoro ? remainingSeconds : elapsedSeconds;
  const formattedDisplay = formatTime(displaySeconds);
  const progressFraction = Math.min(
    1,
    Math.max(0, isPomodoro ? elapsedSeconds / targetTotalSec : 1)
  );

  return {
    session,
    state: session?.state ?? "idle",
    loading,
    actionLoading,
    error,
    elapsedSeconds,
    remainingSeconds,
    displaySeconds,
    formattedDisplay,
    progressFraction,
    start,
    pause,
    resume,
    stop,
  };
}
