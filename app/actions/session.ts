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

  return data as StudySession;
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

  // 1. Fetch open segment
  const { data: openSegment } = await supabase
    .from("study_session_segments")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .maybeSingle();

  let segmentSeconds = 0;
  if (openSegment) {
    segmentSeconds = Math.max(
      0,
      Math.floor(
        (new Date(now).getTime() - new Date(openSegment.started_at).getTime()) / 1000
      )
    );

    // Close the segment
    await supabase
      .from("study_session_segments")
      .update({
        ended_at: now,
        duration_seconds: segmentSeconds,
      })
      .eq("id", openSegment.id);
  }

  // 2. Fetch current session to calculate updated accumulated seconds
  const { data: currentSession } = await supabase
    .from("study_sessions")
    .select("accumulated_seconds")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  const totalAccumulated =
    (currentSession?.accumulated_seconds || 0) + segmentSeconds;

  // 3. Update session to paused
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
 * Stop/complete the study session, calculating final duration.
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

  // 1. If currently in an open segment, close it
  const { data: openSegment } = await supabase
    .from("study_session_segments")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .is("ended_at", null)
    .maybeSingle();

  let additionalSeconds = 0;
  if (openSegment) {
    additionalSeconds = Math.max(
      0,
      Math.floor(
        (new Date(now).getTime() - new Date(openSegment.started_at).getTime()) / 1000
      )
    );

    await supabase
      .from("study_session_segments")
      .update({
        ended_at: now,
        duration_seconds: additionalSeconds,
      })
      .eq("id", openSegment.id);
  }

  // 2. Calculate final accumulated seconds
  const { data: currentSession } = await supabase
    .from("study_sessions")
    .select("accumulated_seconds")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  const finalSeconds =
    (currentSession?.accumulated_seconds || 0) + additionalSeconds;

  // 3. Mark session as completed
  const { data: completedSession, error } = await supabase
    .from("study_sessions")
    .update({
      state: "completed",
      ended_at: now,
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

