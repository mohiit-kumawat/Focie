"use server";

import { createClient } from "@/lib/supabase/server";
import {
  startSessionSchema,
  pauseSessionSchema,
  resumeSessionSchema,
  stopSessionSchema,
  StartSessionInput,
} from "@/lib/validations/session";
import type { StudySession } from "@/types/database";

export interface SessionActionResult {
  success: boolean;
  session?: StudySession | null;
  error?: string;
}

/**
 * Fetch the currently active or paused session for the logged-in user.
 */
export async function getActiveStudySession(): Promise<StudySession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("user_id", user.id)
    .in("state", ["active", "paused"])
    .order("started_at", { ascending: false })
    .maybeSingle();

  if (error || !data) return null;

  const session = data as StudySession;

  // Defensive Lazy Reconciliation: If Pomodoro target was exceeded while user was away,
  // auto-complete it on the server and cap accumulated time to target_minutes!
  if (session.mode === "pomodoro") {
    const maxAllowed = (session.target_minutes || 25) * 60;
    const accumulated = session.accumulated_seconds || 0;

    if (session.state === "paused") {
      if (accumulated >= maxAllowed) {
        await supabase
          .from("study_sessions")
          .update({
            state: "completed",
            ended_at: session.paused_at || new Date().toISOString(),
            accumulated_seconds: maxAllowed,
          })
          .eq("id", session.id);
        return null;
      }
    } else if (session.state === "active") {
      const { data: openSegment } = await supabase
        .from("study_session_segments")
        .select("*")
        .eq("session_id", session.id)
        .eq("user_id", user.id)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .maybeSingle();

      const nowMs = Date.now();
      const segStartMs = openSegment
        ? new Date(openSegment.started_at).getTime()
        : new Date(session.started_at).getTime();
      const segElapsed = Math.max(0, Math.floor((nowMs - segStartMs) / 1000));
      const totalElapsed = accumulated + segElapsed;

      if (totalElapsed >= maxAllowed) {
        const neededSegDuration = Math.max(0, maxAllowed - accumulated);
        const effectiveEnd = new Date(segStartMs + neededSegDuration * 1000).toISOString();

        if (openSegment) {
          await supabase
            .from("study_session_segments")
            .update({
              ended_at: effectiveEnd,
              duration_seconds: neededSegDuration,
            })
            .eq("id", openSegment.id);
        }

        await supabase
          .from("study_sessions")
          .update({
            state: "completed",
            ended_at: effectiveEnd,
            accumulated_seconds: maxAllowed,
          })
          .eq("id", session.id);

        return null;
      }
    }
  }

  return session;
}

/**
 * Start a new study session with server-authoritative timestamps.
 */
export async function startStudySession(
  input: StartSessionInput
): Promise<SessionActionResult> {
  const validation = startSessionSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  // Check if an active or paused session already exists
  const existing = await getActiveStudySession();
  if (existing) {
    return {
      success: true,
      session: existing,
      error: "You already have an active study session.",
    };
  }

  const now = new Date().toISOString();

  // 1. Create session record
  const { data: session, error: sessionError } = await supabase
    .from("study_sessions")
    .insert({
      user_id: user.id,
      state: "active",
      mode: validation.data.mode,
      target_minutes: validation.data.target_minutes,
      subject_tag: validation.data.subject_tag,
      started_at: now,
      accumulated_seconds: 0,
    })
    .select()
    .single();

  if (sessionError || !session) {
    return {
      success: false,
      error: sessionError?.message || "Failed to start study session.",
    };
  }

  // 2. Create initial session segment
  await supabase.from("study_session_segments").insert({
    session_id: session.id,
    user_id: user.id,
    started_at: now,
    duration_seconds: 0,
  });

  return { success: true, session: session as StudySession };
}

/**
 * Pause the active session, closing the current segment.
 */
export async function pauseStudySession(
  sessionId: string
): Promise<SessionActionResult> {
  const validation = pauseSessionSchema.safeParse({ session_id: sessionId });
  if (!validation.success) {
    return { success: false, error: "Invalid session ID" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const now = new Date().toISOString();

  // 1. Fetch current session
  const { data: currentSession } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!currentSession) {
    return { success: false, error: "Session not found" };
  }

  // 2. Fetch open segment
  const { data: openSegment } = await supabase
    .from("study_session_segments")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .maybeSingle();

  let segmentSeconds = 0;
  let effectiveEnd = now;

  if (openSegment) {
    const rawSegmentSeconds = Math.max(
      0,
      Math.floor(
        (new Date(now).getTime() - new Date(openSegment.started_at).getTime()) / 1000
      )
    );

    if (currentSession.mode === "pomodoro") {
      const maxAllowed = (currentSession.target_minutes || 25) * 60;
      const acc = currentSession.accumulated_seconds || 0;
      const needed = Math.max(0, maxAllowed - acc);
      segmentSeconds = Math.min(rawSegmentSeconds, needed);
      effectiveEnd = new Date(
        new Date(openSegment.started_at).getTime() + segmentSeconds * 1000
      ).toISOString();
    } else {
      segmentSeconds = rawSegmentSeconds;
      effectiveEnd = now;
    }

    // Close the segment with accurate duration
    await supabase
      .from("study_session_segments")
      .update({
        ended_at: effectiveEnd,
        duration_seconds: segmentSeconds,
      })
      .eq("id", openSegment.id);
  }

  const acc = currentSession.accumulated_seconds || 0;
  let totalAccumulated = acc + segmentSeconds;

  // 3. For Pomodoro, clamp to target and mark completed if ceiling reached
  if (currentSession.mode === "pomodoro") {
    const maxAllowed = (currentSession.target_minutes || 25) * 60;
    if (totalAccumulated >= maxAllowed) {
      totalAccumulated = maxAllowed;

      const { data: completedSession, error: completeError } = await supabase
        .from("study_sessions")
        .update({
          state: "completed",
          ended_at: effectiveEnd,
          accumulated_seconds: maxAllowed,
        })
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (completeError || !completedSession) {
        return {
          success: false,
          error: completeError?.message || "Failed to complete session",
        };
      }

      return { success: true, session: completedSession as StudySession };
    }
  }

  // 4. Update session to paused
  const { data: updatedSession, error: updateError } = await supabase
    .from("study_sessions")
    .update({
      state: "paused",
      paused_at: now,
      accumulated_seconds: totalAccumulated,
    })
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (updateError || !updatedSession) {
    return { success: false, error: updateError?.message || "Failed to pause session" };
  }

  return { success: true, session: updatedSession as StudySession };
}

/**
 * Resume a paused session by starting a new segment.
 */
export async function resumeStudySession(
  sessionId: string
): Promise<SessionActionResult> {
  const validation = resumeSessionSchema.safeParse({ session_id: sessionId });
  if (!validation.success) {
    return { success: false, error: "Invalid session ID" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const now = new Date().toISOString();

  // 1. Update session to active
  const { data: session, error } = await supabase
    .from("study_sessions")
    .update({
      state: "active",
      paused_at: null,
    })
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !session) {
    return { success: false, error: error?.message || "Failed to resume session" };
  }

  // 2. Start a new segment
  await supabase.from("study_session_segments").insert({
    session_id: sessionId,
    user_id: user.id,
    started_at: now,
    duration_seconds: 0,
  });

  return { success: true, session: session as StudySession };
}

/**
 * Stop/complete the study session, calculating final duration with Pomodoro ceiling clamping.
 */
export async function stopStudySession(
  sessionId: string,
  notes?: string
): Promise<SessionActionResult> {
  const validation = stopSessionSchema.safeParse({ session_id: sessionId, notes });
  if (!validation.success) {
    return { success: false, error: "Invalid session ID or notes format" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const now = new Date().toISOString();

  // 1. Fetch current session
  const { data: currentSession } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!currentSession) {
    return { success: false, error: "Session not found" };
  }

  // 2. If currently in an open segment, close it
  const { data: openSegment } = await supabase
    .from("study_session_segments")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .maybeSingle();

  let additionalSeconds = 0;
  let effectiveEnd = now;

  if (openSegment) {
    const rawAdditional = Math.max(
      0,
      Math.floor(
        (new Date(now).getTime() - new Date(openSegment.started_at).getTime()) / 1000
      )
    );

    if (currentSession.mode === "pomodoro") {
      const maxAllowed = (currentSession.target_minutes || 25) * 60;
      const acc = currentSession.accumulated_seconds || 0;
      const needed = Math.max(0, maxAllowed - acc);
      additionalSeconds = Math.min(rawAdditional, needed);
      effectiveEnd = new Date(
        new Date(openSegment.started_at).getTime() + additionalSeconds * 1000
      ).toISOString();
    } else {
      additionalSeconds = rawAdditional;
      effectiveEnd = now;
    }

    await supabase
      .from("study_session_segments")
      .update({
        ended_at: effectiveEnd,
        duration_seconds: additionalSeconds,
      })
      .eq("id", openSegment.id);
  }

  // 3. Calculate final accumulated seconds
  const acc = currentSession.accumulated_seconds || 0;
  let finalSeconds = acc + additionalSeconds;

  if (currentSession.mode === "pomodoro") {
    const maxAllowed = (currentSession.target_minutes || 25) * 60;
    finalSeconds = Math.min(maxAllowed, finalSeconds);
  }

  // 4. Mark session as completed
  const { data: completedSession, error } = await supabase
    .from("study_sessions")
    .update({
      state: "completed",
      ended_at: effectiveEnd,
      accumulated_seconds: finalSeconds,
      notes: validation.data.notes ?? null,
    })
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !completedSession) {
    return { success: false, error: error?.message || "Failed to complete session" };
  }

  return { success: true, session: completedSession as StudySession };
}

/**
 * Persist user's custom focus subjects into their profile preferences in Supabase.
 */
export async function saveUserCustomSubjects(
  subjects: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const cleanSubjects = subjects
      .filter((s) => typeof s === "string" && s.trim().length > 0)
      .map((s) => s.trim().slice(0, 50))
      .slice(0, 30);

    const { data: profile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .single();

    const currentPreferences =
      profile?.preferences && typeof profile.preferences === "object" && !Array.isArray(profile.preferences)
        ? (profile.preferences as Record<string, unknown>)
        : {};

    const updatedPreferences = {
      ...currentPreferences,
      custom_subjects: cleanSubjects,
    };

    const { error } = await supabase
      .from("profiles")
      .update({
        preferences: updatedPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save subjects",
    };
  }
}


