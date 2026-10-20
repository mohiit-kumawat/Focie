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
  try {
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

    // 2. Fetch rooms owned by user
    const { data: ownedRooms } = await supabase
      .from("study_rooms")
      .select("*")
      .eq("owner_id", user.id);

    // 3. Fetch rooms user is a member of (if any)
    const memberRoomIds = (memberships || []).map((m) => m.room_id);
    let joinedRooms: StudyRoom[] = [];
    if (memberRoomIds.length > 0) {
      const { data: jr } = await supabase
        .from("study_rooms")
        .select("*")
        .in("id", memberRoomIds);
      if (jr) joinedRooms = jr as StudyRoom[];
    }

    // Combine owned & joined rooms with deduplication by room id
    const roomsMap = new Map<string, StudyRoom>();
    if (ownedRooms) {
      for (const r of ownedRooms) roomsMap.set(r.id, r as StudyRoom);
    }
    for (const r of joinedRooms) {
      roomsMap.set(r.id, r);
    }

    const rooms = Array.from(roomsMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (rooms.length === 0) return [];

    const allRoomIds = rooms.map((r) => r.id);

    // 4. Fetch all members for these rooms
    const { data: allMembers } = await supabase
      .from("room_members")
      .select("room_id, user_id, role")
      .in("room_id", allRoomIds);

    const memberUserIds = Array.from(new Set((allMembers || []).map((m) => m.user_id)));

    // Fetch profiles and active study sessions
    const profileMap = new Map<string, Profile>();
    const activeMap = new Map<string, string>();

    if (memberUserIds.length > 0) {
      const [{ data: profiles }, { data: activeSessions }] = await Promise.all([
        supabase.from("profiles").select("*").in("id", memberUserIds),
        supabase.from("study_sessions").select("user_id, subject_tag").eq("state", "active").in("user_id", memberUserIds),
      ]);

      if (profiles) {
        for (const p of profiles) profileMap.set(p.id, p as Profile);
      }
      if (activeSessions) {
        for (const a of activeSessions) activeMap.set(a.user_id, a.subject_tag);
      }
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
  } catch (err) {
    console.error("getUserStudyRooms error:", err);
    return [];
  }
}

/**
 * Create a new cozy study room.
 */
export async function createStudyRoom(
  input: CreateRoomInput
): Promise<{ success: boolean; room?: StudyRoom; error?: string }> {
  try {
    const validation = createRoomSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Invalid input" };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Authentication session expired. Please refresh the page." };
    }

    // Generate unique 8-character alphanumeric invite code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let inviteCode = "";
    for (let i = 0; i < 8; i++) {
      inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const { data: room, error: roomError } = await supabase
      .from("study_rooms")
      .insert({
        owner_id: user.id,
        name: validation.data.name.trim(),
        description: validation.data.description?.trim() || null,
        is_private: validation.data.is_private,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (roomError || !room) {
      console.error("createStudyRoom: room insert error:", roomError);
      return { success: false, error: roomError?.message || "Failed to create study room" };
    }

    // Automatically add creator as owner
    const { error: memberError } = await supabase.from("room_members").insert({
      room_id: room.id,
      user_id: user.id,
      role: "owner",
    });

    if (memberError) {
      console.warn("createStudyRoom: room_members insert error:", memberError);
    }

    // Post welcome message
    try {
      await supabase.from("room_messages").insert({
        room_id: room.id,
        sender_id: user.id,
        content: `🌸 Welcome to "${room.name}"! Let's study together and keep each other motivated! ✨`,
      });
    } catch {
      // Non-fatal
    }

    revalidatePath("/dashboard");
    return { success: true, room: room as StudyRoom };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    console.error("createStudyRoom caught exception:", err);
    return { success: false, error: message };
  }
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

