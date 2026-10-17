"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  startStudySession,
  pauseStudySession,
  resumeStudySession,
  stopStudySession,
  getActiveStudySession,
} from "@/app/actions/session";
import type { StudySession, SessionMode } from "@/types/database";

export interface UseStudyTimerOptions {
  onSessionComplete?: (session: StudySession) => void;
}

export function useStudyTimer(options?: UseStudyTimerOptions) {
  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Time tracking
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const activeSegmentStartRef = useRef<number | null>(null);

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

  // Sync elapsed time from authoritative timestamps
  const syncElapsedSeconds = useCallback(() => {
    if (!session) {
      setElapsedSeconds(0);
      return;
    }

    const baseAccumulated = session.accumulated_seconds || 0;

    if (session.state === "active" && activeSegmentStartRef.current) {
      const nowMs = Date.now();
      const currentSegmentSec = Math.max(
        0,
        Math.floor((nowMs - activeSegmentStartRef.current) / 1000)
      );
      setElapsedSeconds(baseAccumulated + currentSegmentSec);
    } else {
      setElapsedSeconds(baseAccumulated);
    }
  }, [session]);

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
            // Segment start is updated_at or started_at
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
      setSession(result.session);
      setElapsedSeconds(0);
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
      setSession(result.session);
    } catch {
      setError("Failed to resume session.");
    } finally {
      setActionLoading(false);
    }
  };

  const stop = async (notes?: string) => {
    if (!session) return;
    setActionLoading(true);
    setError(null);
    try {
      const result = await stopStudySession(session.id, notes);
      if (!result.success || !result.session) {
        setError(result.error || "Failed to stop session");
        return;
      }
      activeSegmentStartRef.current = null;
      const finished = result.session;
      setSession(null);
      setElapsedSeconds(0);
      options?.onSessionComplete?.(finished);
      return finished;
    } catch {
      setError("Failed to stop session.");
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
