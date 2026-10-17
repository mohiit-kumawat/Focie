"use server";

import { createClient } from "@/lib/supabase/server";
import {
  sendFriendRequestSchema,
  respondFriendRequestSchema,
  SendFriendRequestInput,
  RespondFriendRequestInput,
} from "@/lib/validations/session";

export interface FriendProfile {
  friendshipId: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  timezone: string;
  status: "pending" | "accepted";
  isRequester: boolean;
}

export interface FriendActiveSession {
  sessionId: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  state: "active" | "paused";
  mode: "pomodoro" | "stopwatch";
  targetMinutes: number;
  subjectTag: string;
  startedAt: string;
  accumulatedSeconds: number;
  lastActiveAt: string;
}

export interface FriendActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Send a new friend request by target username
 */
export async function sendFriendRequest(
  input: SendFriendRequestInput
): Promise<FriendActionResult> {
  const validation = sendFriendRequestSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid username format.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const targetUsername = validation.data.target_username.trim();

  // 1. Find target user profile
  const { data: targetProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .ilike("username", targetUsername)
    .maybeSingle();

  if (profileError || !targetProfile) {
    return {
      success: false,
      error: `User "@${targetUsername}" could not be found.`,
    };
  }

  if (targetProfile.id === user.id) {
    return {
      success: false,
      error: "You cannot send a friend request to yourself!",
    };
  }

  // 2. Check for existing friendship
  const { data: existingFriendship, error: existingError } = await supabase
    .from("friendships")
    .select("*")
    .or(
      `and(requester_id.eq.${user.id},recipient_id.eq.${targetProfile.id}),and(requester_id.eq.${targetProfile.id},recipient_id.eq.${user.id})`
    )
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    return { success: false, error: existingError.message };
  }

  if (existingFriendship) {
    if (existingFriendship.status === "accepted") {
      return {
        success: false,
        error: `You and @${targetProfile.username} are already study buddies! 🌸`,
      };
    }
    if (existingFriendship.status === "pending") {
      if (existingFriendship.requester_id === user.id) {
        return {
          success: false,
          error: `Friend request to @${targetProfile.username} is already pending.`,
        };
      }
      return {
        success: false,
        error: `@${targetProfile.username} has already sent you a friend request! Check incoming requests.`,
      };
    }
    if (existingFriendship.status === "rejected") {
      // Re-send friend request
      const { error: updateError } = await supabase
        .from("friendships")
        .update({
          requester_id: user.id,
          recipient_id: targetProfile.id,
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingFriendship.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }
      return {
        success: true,
        message: `Friend request sent to @${targetProfile.username}! 🌸`,
      };
    }
    if (existingFriendship.status === "blocked") {
      return { success: false, error: "Unable to send friend request." };
    }
  }

  // 3. Insert new friendship
  const { error: insertError } = await supabase.from("friendships").insert({
    requester_id: user.id,
    recipient_id: targetProfile.id,
    status: "pending",
  });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  return {
    success: true,
    message: `Friend request sent to @${targetProfile.username}! 🌸`,
  };
}

/**
 * Respond to an incoming friend request (accept or reject)
 */
export async function respondToFriendRequest(
  input: RespondFriendRequestInput
): Promise<FriendActionResult> {
  const validation = respondFriendRequestSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid input.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const { friendship_id, action } = validation.data;

  // Retrieve friendship
  const { data: friendship, error: fetchError } = await supabase
    .from("friendships")
    .select("*")
    .eq("id", friendship_id)
    .single();

  if (fetchError || !friendship) {
    return { success: false, error: "Friend request not found." };
  }

  // Verify authorization: recipient can accept/reject; requester can cancel
  if (friendship.recipient_id !== user.id && friendship.requester_id !== user.id) {
    return { success: false, error: "Not authorized to manage this friendship." };
  }

  if (action === "accept") {
    if (friendship.recipient_id !== user.id) {
      return { success: false, error: "Only the recipient can accept a friend request." };
    }

    const { error: updateError } = await supabase
      .from("friendships")
      .update({
        status: "accepted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", friendship_id);

    if (updateError) return { success: false, error: updateError.message };
    return { success: true, message: "Friend request accepted! Let's study together! 🎉" };
  }

  if (action === "reject") {
    // Delete friendship record cleanly
    const { error: deleteError } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendship_id);

    if (deleteError) return { success: false, error: deleteError.message };
    return { success: true, message: "Friend request removed." };
  }

  return { success: false, error: "Unsupported action." };
}

/**
 * Fetch all accepted friends with their profiles
 */
export async function getFriendsList(): Promise<FriendProfile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // 1. Fetch accepted friendships
  const { data: friendships, error: friendError } = await supabase
    .from("friendships")
    .select("*")
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .eq("status", "accepted");

  if (friendError || !friendships || friendships.length === 0) {
    return [];
  }

  // 2. Extract friend user IDs
  const friendIdMap = new Map<string, string>(); // friendUserId -> friendshipId
  for (const f of friendships) {
    const friendUserId = f.requester_id === user.id ? f.recipient_id : f.requester_id;
    friendIdMap.set(friendUserId, f.id);
  }

  const friendUserIds = Array.from(friendIdMap.keys());
  if (friendUserIds.length === 0) return [];

  // 3. Fetch friend profiles
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, timezone")
    .in("id", friendUserIds);

  if (profileError || !profiles) return [];

  return profiles.map((p) => ({
    friendshipId: friendIdMap.get(p.id) || "",
    userId: p.id,
    username: p.username,
    displayName: p.display_name,
    avatarUrl: p.avatar_url,
    timezone: p.timezone,
    status: "accepted",
    isRequester: false,
  }));
}

/**
 * Fetch pending incoming & outgoing friend requests
 */
export async function getPendingFriendRequests(): Promise<{
  incoming: FriendProfile[];
  outgoing: FriendProfile[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { incoming: [], outgoing: [] };

  const { data: friendships, error } = await supabase
    .from("friendships")
    .select("*")
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .eq("status", "pending");

  if (error || !friendships || friendships.length === 0) {
    return { incoming: [], outgoing: [] };
  }

  const userIds = new Set<string>();
  friendships.forEach((f) => {
    userIds.add(f.requester_id);
    userIds.add(f.recipient_id);
  });
  userIds.delete(user.id);

  if (userIds.size === 0) return { incoming: [], outgoing: [] };

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, timezone")
    .in("id", Array.from(userIds));

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  const incoming: FriendProfile[] = [];
  const outgoing: FriendProfile[] = [];

  for (const f of friendships) {
    if (f.recipient_id === user.id) {
      // Incoming request from requester
      const p = profileMap.get(f.requester_id);
      if (p) {
        incoming.push({
          friendshipId: f.id,
          userId: p.id,
          username: p.username,
          displayName: p.display_name,
          avatarUrl: p.avatar_url,
          timezone: p.timezone,
          status: "pending",
          isRequester: false,
        });
      }
    } else {
      // Outgoing request to recipient
      const p = profileMap.get(f.recipient_id);
      if (p) {
        outgoing.push({
          friendshipId: f.id,
          userId: p.id,
          username: p.username,
          displayName: p.display_name,
          avatarUrl: p.avatar_url,
          timezone: p.timezone,
          status: "pending",
          isRequester: true,
        });
      }
    }
  }

  return { incoming, outgoing };
}

/**
 * Fetch live active study sessions for all accepted friends
 */
export async function getFriendsActiveSessions(): Promise<FriendActiveSession[]> {
  const friends = await getFriendsList();
  if (friends.length === 0) return [];

  const supabase = await createClient();
  const friendIds = friends.map((f) => f.userId);

  const { data: sessions, error } = await supabase
    .from("study_sessions")
    .select("*")
    .in("user_id", friendIds)
    .in("state", ["active", "paused"])
    .order("started_at", { ascending: false });

  if (error || !sessions || sessions.length === 0) return [];

  const friendProfileMap = new Map(friends.map((f) => [f.userId, f]));

  return sessions.map((s) => {
    const friend = friendProfileMap.get(s.user_id);
    return {
      sessionId: s.id,
      userId: s.user_id,
      username: friend?.username || "buddy",
      displayName: friend?.displayName || null,
      avatarUrl: friend?.avatarUrl || "/images/mascot/fumi-idle.webp",
      state: s.state as "active" | "paused",
      mode: s.mode as "pomodoro" | "stopwatch",
      targetMinutes: s.target_minutes,
      subjectTag: s.subject_tag,
      startedAt: s.started_at,
      accumulatedSeconds: s.accumulated_seconds,
      lastActiveAt: s.updated_at || s.started_at,
    };
  });
}

