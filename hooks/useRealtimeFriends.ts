"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getFriendsList,
  getPendingFriendRequests,
  getFriendsActiveSessions,
  sendFriendRequest,
  respondToFriendRequest,
  FriendProfile,
  FriendActiveSession,
} from "@/app/actions/friends";

export interface UseRealtimeFriendsReturn {
  friends: FriendProfile[];
  activeSessions: FriendActiveSession[];
  pendingIncoming: FriendProfile[];
  pendingOutgoing: FriendProfile[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  successMessage: string | null;
  clearMessages: () => void;
  sendRequest: (targetUsername: string) => Promise<boolean>;
  respondRequest: (friendshipId: string, action: "accept" | "reject") => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useRealtimeFriends(): UseRealtimeFriendsReturn {
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [activeSessions, setActiveSessions] = useState<FriendActiveSession[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<FriendProfile[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const supabaseRef = useRef(createClient());

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  // Fetch all initial data
  const refresh = useCallback(async () => {
    try {
      const [friendsList, pending, sessions] = await Promise.all([
        getFriendsList(),
        getPendingFriendRequests(),
        getFriendsActiveSessions(),
      ]);

      setFriends(friendsList);
      setPendingIncoming(pending.incoming);
      setPendingOutgoing(pending.outgoing);
      setActiveSessions(sessions);
    } catch (err: unknown) {
      console.error("Failed to refresh friends & live presence:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      setLoading(true);
      await refresh();
      if (isMounted) setLoading(false);
    }

    loadInitial();

    return () => {
      isMounted = false;
    };
  }, [refresh]);

  // Realtime subscription to study_sessions and friendships
  useEffect(() => {
    const supabase = supabaseRef.current;

    const channel = supabase
      .channel("focie-friends-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "study_sessions",
        },
        async () => {
          // Re-fetch active sessions when any friend starts/pauses/stops studying
          const updatedSessions = await getFriendsActiveSessions();
          setActiveSessions(updatedSessions);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
        },
        async () => {
          // Re-fetch friends list and pending requests when friendships change
          await refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  // Action: Send friend request
  const sendRequest = async (targetUsername: string): Promise<boolean> => {
    setActionLoading(true);
    clearMessages();

    try {
      const result = await sendFriendRequest({ target_username: targetUsername });
      if (!result.success) {
        setError(result.error || "Failed to send friend request.");
        return false;
      }

      setSuccessMessage(result.message || "Friend request sent! 🌸");
      await refresh();
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Accept or Reject incoming request
  const respondRequest = async (
    friendshipId: string,
    action: "accept" | "reject"
  ): Promise<boolean> => {
    setActionLoading(true);
    clearMessages();

    try {
      const result = await respondToFriendRequest({
        friendship_id: friendshipId,
        action,
      });

      if (!result.success) {
        setError(result.error || "Failed to respond to friend request.");
        return false;
      }

      setSuccessMessage(result.message || "Success!");
      await refresh();
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    friends,
    activeSessions,
    pendingIncoming,
    pendingOutgoing,
    loading,
    actionLoading,
    error,
    successMessage,
    clearMessages,
    sendRequest,
    respondRequest,
    refresh,
  };
}

