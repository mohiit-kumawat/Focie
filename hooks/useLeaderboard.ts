"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getFriendLeaderboard,
  type LeaderboardMode,
  type LeaderboardResult,
} from "@/app/actions/leaderboard";

export function useLeaderboard(initialMode: LeaderboardMode = "personal_day") {
  const [mode, setMode] = useState<LeaderboardMode>(initialMode);
  const [data, setData] = useState<LeaderboardResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const prevRankRef = useRef<number | null>(null);
  const [rankUpMessage, setRankUpMessage] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async (selectedMode: LeaderboardMode) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFriendLeaderboard(selectedMode);
      if (res.success) {
        // Detect if user climbed rank!
        if (
          prevRankRef.current !== null &&
          res.myRank !== undefined &&
          res.myRank < prevRankRef.current
        ) {
          setRankUpMessage(`🎉 Leveled up to Rank #${res.myRank}!`);
          setTimeout(() => setRankUpMessage(null), 4000);
        }
        if (res.myRank !== undefined) {
          prevRankRef.current = res.myRank;
        }
        setData(res);
      } else {
        setError(res.error || "Failed to load leaderboard");
      }
    } catch {
      setError("Network error loading leaderboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(mode);
  }, [mode, fetchLeaderboard]);

  // Subscribe to real-time session changes via Supabase Realtime
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("leaderboard-realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "study_sessions" },
        () => {
          // Re-fetch rankings when any friend or user finishes a session
          fetchLeaderboard(mode);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mode, fetchLeaderboard]);

  return {
    mode,
    setMode,
    data,
    loading,
    error,
    rankUpMessage,
    refresh: () => fetchLeaderboard(mode),
  };
}

