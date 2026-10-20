"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createRoomSchema,
  joinRoomSchema,
  sendRoomMessageSchema,
  type CreateRoomInput,
  type JoinRoomInput,
  type SendRoomMessageInput,
} from "@/lib/validations/gifting-rooms";
import type { StudyRoom, RoomMember, RoomMessage, Profile } from "@/types/database";

export interface RoomWithDetails extends StudyRoom {
  memberCount: number;
  isOwner: boolean;
  members: {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    role: "owner" | "member";
    isStudyingNow?: boolean;
    currentSubject?: string;
  }[];
}

export interface ChatMessageWithSender extends RoomMessage {
  senderName: string;
  senderAvatar: string | null;
  isCurrentUser: boolean;
}

/**
 * Fetch all rooms the current user has joined or created.
 */
export async function getUserStudyRooms(): Promise<RoomWithDetails[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // 1. Fetch user's room memberships
  const { data: memberships } = await supabase
    .from("room_members")
    .select("room_id, role")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) {
    // Check if user owns any rooms
    const { data: ownedRooms } = await supabase
      .from("study_rooms")
      .select("*")
      .eq("owner_id", user.id);

    if (!ownedRooms || ownedRooms.length === 0) return [];
  }

  const roomIds = (memberships || []).map((m) => m.room_id);

  // 2. Fetch room details
  const { data: rooms } = await supabase
    .from("study_rooms")
    .select("*")
    .or(`owner_id.eq.${user.id},id.in.(${roomIds.length ? roomIds.join(",") : "00000000-0000-0000-0000-000000000000"})`)
    .order("created_at", { ascending: false });

  if (!rooms || rooms.length === 0) return [];

  const allRoomIds = rooms.map((r) => r.id);

  // 3. Fetch all members for these rooms
  const { data: allMembers } = await supabase
    .from("room_members")
    .select("room_id, user_id, role")
    .in("room_id", allRoomIds);

  const memberUserIds = Array.from(new Set((allMembers || []).map((m) => m.user_id)));

  // Fetch profiles and active study sessions
  const [{ data: profiles }, { data: activeSessions }] = await Promise.all([
    supabase.from("profiles").select("*").in("id", memberUserIds),
    supabase.from("study_sessions").select("user_id, subject_tag").eq("state", "active").in("user_id", memberUserIds),
  ]);

  const profileMap = new Map<string, Profile>();
  if (profiles) {
    for (const p of profiles) profileMap.set(p.id, p as Profile);
  }

  const activeMap = new Map<string, string>();
  if (activeSessions) {
    for (const a of activeSessions) activeMap.set(a.user_id, a.subject_tag);
  }

  return rooms.map((r) => {
    const rMembers = (allMembers || [])
      .filter((m) => m.room_id === r.id)
      .map((m) => {
        const prof = profileMap.get(m.user_id);
        const activeSub = activeMap.get(m.user_id);
        return {
          userId: m.user_id,
          username: prof?.username || "student",
          displayName: prof?.display_name || prof?.username || "Study Buddy",
          avatarUrl: prof?.avatar_url || null,
          role: m.role as "owner" | "member",
          isStudyingNow: !!activeSub,
          currentSubject: activeSub,
        };
      });

    return {
      ...(r as StudyRoom),
      memberCount: rMembers.length,
      isOwner: r.owner_id === user.id,
      members: rMembers,
    };
  });
}

/**
 * Create a new cozy study room.
 */
export async function createStudyRoom(
  input: CreateRoomInput
): Promise<{ success: boolean; room?: StudyRoom; error?: string }> {
  const validation = createRoomSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  // Generate unique 8-character invite code
  const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

  const { data: room, error: roomError } = await supabase
    .from("study_rooms")
    .insert({
      owner_id: user.id,
      name: validation.data.name,
      description: validation.data.description || null,
      is_private: validation.data.is_private,
      invite_code: inviteCode,
    })
    .select()
    .single();

  if (roomError || !room) {
    return { success: false, error: roomError?.message || "Failed to create study room" };
  }

  // Automatically add creator as owner
  await supabase.from("room_members").insert({
    room_id: room.id,
    user_id: user.id,
    role: "owner",
  });

  // Post welcome message
  await supabase.from("room_messages").insert({
    room_id: room.id,
    sender_id: user.id,
    content: `🌸 Welcome to "${room.name}"! Let's study together and keep each other motivated! ✨`,
  });

  revalidatePath("/dashboard");
  return { success: true, room: room as StudyRoom };
}

/**
 * Join a room via its invite code.
 */
export async function joinStudyRoomByCode(
  input: JoinRoomInput
): Promise<{ success: boolean; roomId?: string; error?: string }> {
  const validation = joinRoomSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: "Invalid invite code format" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const code = validation.data.invite_code.trim().toUpperCase();

  // Find room by code
  const { data: room } = await supabase
    .from("study_rooms")
    .select("id, name")
    .eq("invite_code", code)
    .maybeSingle();

  if (!room) {
    return { success: false, error: "No study room found with this invite code." };
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("room_members")
    .select("id")
    .eq("room_id", room.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return { success: true, roomId: room.id };
  }

  // Join room
  const { error: joinError } = await supabase.from("room_members").insert({
    room_id: room.id,
    user_id: user.id,
    role: "member",
  });

  if (joinError) {
    return { success: false, error: "Failed to join room." };
  }

  // Post joining greeting
  await supabase.from("room_messages").insert({
    room_id: room.id,
    sender_id: user.id,
    content: "Joined the study room! Ready to focus! 🌸",
  });

  revalidatePath("/dashboard");
  return { success: true, roomId: room.id };
}

/**
 * Fetch messages for a specific room.
 */
export async function getRoomMessages(roomId: string): Promise<ChatMessageWithSender[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: messages } = await supabase
    .from("room_messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (!messages || messages.length === 0) return [];

  const senderIds = Array.from(new Set(messages.map((m) => m.sender_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .in("id", senderIds);

  const profileMap = new Map<string, { name: string; avatar: string | null }>();
  if (profiles) {
    for (const p of profiles) {
      profileMap.set(p.id, {
        name: p.display_name || p.username || "Study Buddy",
        avatar: p.avatar_url,
      });
    }
  }

  return messages.map((m) => {
    const sender = profileMap.get(m.sender_id);
    return {
      ...(m as RoomMessage),
      senderName: sender?.name || "Study Buddy",
      senderAvatar: sender?.avatar || null,
      isCurrentUser: m.sender_id === user.id,
    };
  });
}

/**
 * Send a chat message in a room.
 */
export async function sendChatMessage(
  input: SendRoomMessageInput
): Promise<{ success: boolean; message?: RoomMessage; error?: string }> {
  const validation = sendRoomMessageSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || "Invalid message" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { room_id, content } = validation.data;

  // Verify membership
  const { data: member } = await supabase
    .from("room_members")
    .select("id")
    .eq("room_id", room_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    return { success: false, error: "You must be a member of this room to send messages." };
  }

  const { data: message, error } = await supabase
    .from("room_messages")
    .insert({
      room_id,
      sender_id: user.id,
      content,
    })
    .select()
    .single();

  if (error || !message) {
    return { success: false, error: error?.message || "Failed to send message" };
  }

  return { success: true, message: message as RoomMessage };
}

