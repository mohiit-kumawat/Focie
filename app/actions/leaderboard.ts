"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getPersonalStudyDayWindow,
  getSharedChallengeWindow,
  getWeeklyStudyWindow,
  calculateTotalFocusedSecondsInWindow,
  rankLeaderboardParticipants,
  type RankedLeaderboardEntry,
  type LeaderboardParticipant,
  type StudyDayWindow,
} from "@/lib/time/study-day";
import type { Profile, StudyDaySettings, StudySession } from "@/types/database";

export type LeaderboardMode = "personal_day" | "shared_challenge" | "weekly";

export interface LeaderboardResult {
  success: boolean;
  mode: LeaderboardMode;
  userWindow: StudyDayWindow;
  rankings: RankedLeaderboardEntry[];
  myRank?: number;
  totalParticipants: number;
  error?: string;
}

/**
 * Fetch friend-group leaderboard with exact window calculations and tie resolution.
 */
export async function getFriendLeaderboard(
  mode: LeaderboardMode = "personal_day"
): Promise<LeaderboardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      mode,
      userWindow: getSharedChallengeWindow(),
      rankings: [],
      totalParticipants: 0,
      error: "Unauthorized",
    };
  }

  const now = new Date();

  // 1. Fetch user's own profile and study day settings
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: userSettings } = await supabase
    .from("study_day_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const userDayStart = userSettings?.day_start_time || "06:00:00";
  const userTz = userSettings?.timezone || userProfile?.timezone || "Asia/Kolkata";

  const userWindow =
    mode === "shared_challenge"
      ? getSharedChallengeWindow(now, 24)
      : mode === "weekly"
      ? getWeeklyStudyWindow(now, userDayStart, userTz)
      : getPersonalStudyDayWindow(now, userDayStart, userTz);

  // 2. Fetch accepted friends
  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, recipient_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

  const friendIds: string[] = [];
  if (friendships) {
    for (const f of friendships) {
      if (f.requester_id === user.id) friendIds.push(f.recipient_id);
      else friendIds.push(f.requester_id);
    }
  }

  const allParticipantIds = [user.id, ...friendIds];

  // 3. Fetch profiles and settings for all participants
  const [{ data: profiles }, { data: settingsList }, { data: activeSessions }] =
    await Promise.all([
      supabase.from("profiles").select("*").in("id", allParticipantIds),
      supabase.from("study_day_settings").select("*").in("user_id", allParticipantIds),
      supabase
        .from("study_sessions")
        .select("*")
        .in("user_id", allParticipantIds)
        .in("state", ["active", "paused"]),
    ]);

  const profileMap = new Map<string, Profile>();
  if (profiles) {
    for (const p of profiles) profileMap.set(p.id, p as Profile);
  }

  const settingsMap = new Map<string, StudyDaySettings>();
  if (settingsList) {
    for (const s of settingsList) settingsMap.set(s.user_id, s as StudyDaySettings);
  }

  const activeSessionMap = new Map<string, StudySession>();
  if (activeSessions) {
    for (const a of activeSessions) activeSessionMap.set(a.user_id, a as StudySession);
  }

  // 4. Calculate total focused seconds for each participant
  const participants: LeaderboardParticipant[] = [];

  for (const pid of allParticipantIds) {
    const prof = profileMap.get(pid);
    const sett = settingsMap.get(pid);
    const pDayStart = sett?.day_start_time || "06:00:00";
    const pTz = sett?.timezone || prof?.timezone || "Asia/Kolkata";

    // Determine target evaluation window for this participant
    const participantWindow =
      mode === "shared_challenge"
        ? getSharedChallengeWindow(now, 24)
        : mode === "weekly"
        ? getWeeklyStudyWindow(now, pDayStart, pTz)
        : getPersonalStudyDayWindow(now, pDayStart, pTz);

    // Fetch segments overlapping with their window
    const { data: rawSegments } = await supabase
      .from("study_session_segments")
      .select("started_at, ended_at, duration_seconds")
      .eq("user_id", pid)
      .lt("started_at", participantWindow.windowEnd.toISOString())
      .or(`ended_at.is.null,ended_at.gt.${participantWindow.windowStart.toISOString()}`);

    const segments = (rawSegments || []).map((s) => ({
      startedAt: s.started_at,
      endedAt: s.ended_at,
      durationSeconds: s.duration_seconds,
    }));

    const focusedSeconds = calculateTotalFocusedSecondsInWindow(
      segments,
      participantWindow,
      now
    );

    const active = activeSessionMap.get(pid);

    participants.push({
      userId: pid,
      username: prof?.username || "student",
      displayName: prof?.display_name || prof?.username || "Study Buddy",
      avatarUrl: prof?.avatar_url || null,
      focusedSeconds,
      isStudyingNow: active?.state === "active",
      currentSubject: active?.subject_tag,
      timezone: pTz,
      dayStartTime: pDayStart,
    });
  }

  // 5. Rank with standard competition tie-break
  const rankings = rankLeaderboardParticipants(participants, user.id);
  const myEntry = rankings.find((r) => r.isCurrentUser);

  return {
    success: true,
    mode,
    userWindow,
    rankings,
    myRank: myEntry?.rank,
    totalParticipants: rankings.length,
  };
}

/**
 * Update user's personal study-day settings (day_start_time and timezone).
 */
export async function updateStudyDaySettings(
  dayStartTime: string,
  timezone: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Ensure format is HH:MM:SS
  const parts = dayStartTime.trim().split(":");
  const h = String(Math.min(23, Math.max(0, parseInt(parts[0] || "6", 10)))).padStart(2, "0");
  const m = String(Math.min(59, Math.max(0, parseInt(parts[1] || "0", 10)))).padStart(2, "0");
  const formattedTime = `${h}:${m}:00`;

  const { error } = await supabase
    .from("study_day_settings")
    .upsert(
      {
        user_id: user.id,
        day_start_time: formattedTime,
        timezone: timezone.trim() || "Asia/Kolkata",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

