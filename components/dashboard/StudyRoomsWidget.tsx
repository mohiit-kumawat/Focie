"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Plus,
  Hash,
  Send,
  Lock,
  Globe,
  Copy,
  Check,
  ChevronLeft,
  RotateCw,
  Loader2,
  Sparkles,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getUserStudyRooms,
  createStudyRoom,
  joinStudyRoomByCode,
  getRoomMessages,
  sendChatMessage,
  type RoomWithDetails,
  type ChatMessageWithSender,
} from "@/app/actions/rooms";

const QUICK_EMOJIS = ["🌸", "🍵", "💻", "✨", "💖", "☕", "🔥", "📚"];

interface StudyRoomsWidgetProps {
  initialRooms?: RoomWithDetails[];
  initialActiveRoom?: RoomWithDetails | null;
  initialMessages?: ChatMessageWithSender[];
  previewMode?: boolean;
}

export function StudyRoomsWidget({
  initialRooms = [],
  initialActiveRoom = null,
  initialMessages = [],
  previewMode = false,
}: StudyRoomsWidgetProps) {
  const [rooms, setRooms] = useState<RoomWithDetails[]>(initialRooms);
  const [activeRoom, setActiveRoom] = useState<RoomWithDetails | null>(initialActiveRoom);
  const [messages, setMessages] = useState<ChatMessageWithSender[]>(initialMessages);
  const [loading, setLoading] = useState<boolean>(previewMode ? false : !initialRooms.length);
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // Forms
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newRoomName, setNewRoomName] = useState<string>("");
  const [newRoomDesc, setNewRoomDesc] = useState<string>("");
  const [newRoomPrivate, setNewRoomPrivate] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [joinCodeInput, setJoinCodeInput] = useState<string>("");
  const [showJoinInput, setShowJoinInput] = useState<boolean>(false);
  const [joining, setJoining] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Chat message input
  const [chatInput, setChatInput] = useState<string>("");
  const [sendingMsg, setSendingMsg] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserStudyRooms();
      setRooms(data);
    } catch {
      // Ignore background errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (previewMode) return;
    loadRooms();
  }, [loadRooms, previewMode]);

  // Load chat messages when active room changes
  useEffect(() => {
    if (previewMode) return;
    if (!activeRoom) return;
    let isMounted = true;
    setChatLoading(true);

    getRoomMessages(activeRoom.id).then((msgs) => {
      if (isMounted) {
        setMessages(msgs);
        setChatLoading(false);
      }
    });

    // Subscribe to realtime messages for active room
    const supabase = createClient();
    const channel = supabase
      .channel(`room-messages-${activeRoom.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_messages",
          filter: `room_id=eq.${activeRoom.id}`,
        },
        () => {
          // Re-fetch messages on insert
          getRoomMessages(activeRoom.id).then((fresh) => {
            if (isMounted) setMessages(fresh);
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [activeRoom]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeRoom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeRoom]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    setCreating(true);
    setCreateError(null);

    try {
      const res = await createStudyRoom({
        name: newRoomName.trim(),
        description: newRoomDesc.trim() || undefined,
        is_private: newRoomPrivate,
      });

      if (res.success && res.room) {
        setShowCreateModal(false);
        setNewRoomName("");
        setNewRoomDesc("");
        setCreateError(null);
        await loadRooms();
        setActiveRoom(res.room as RoomWithDetails);
      } else {
        setCreateError(res.error || "Failed to create study circle. Please try again.");
      }
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Error creating room");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setJoining(true);
    setJoinError(null);

    try {
      const res = await joinStudyRoomByCode({ invite_code: joinCodeInput.trim() });
      if (res.success) {
        setShowJoinInput(false);
        setJoinCodeInput("");
        setJoinError(null);
        await loadRooms();
      } else {
        setJoinError(res.error || "Could not find room with this invite code.");
      }
    } catch (err: unknown) {
      setJoinError(err instanceof Error ? err.message : "Error joining room");
    } finally {
      setJoining(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || chatInput).trim();
    if (!content || !activeRoom || sendingMsg) return;

    setSendingMsg(true);
    if (!textToSend) setChatInput("");

    try {
      await sendChatMessage({
        room_id: activeRoom.id,
        content,
      });
      const fresh = await getRoomMessages(activeRoom.id);
      setMessages(fresh);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-[#241D33] border border-[#F0E4DE] dark:border-[#40354F] shadow-xl dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)] p-6 sm:p-7 lg:p-8 transition-colors relative overflow-hidden">
      {/* Top Ambient Glow Line */}
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#C5A7FF]/60 to-transparent pointer-events-none" />

      {/* VIEW A: ACTIVE ROOM CHAT VIEW */}
      {activeRoom ? (
        <div className="space-y-4">
          {/* Active Room Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#F0E4DE] dark:border-[#352B46]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveRoom(null)}
                className="p-2 rounded-xl bg-[#FFF5F8] dark:bg-[#302641] text-[#7D6E7E] dark:text-[#B9AEC9] hover:text-[#FF729F] transition-all cursor-pointer"
                title="Back to all rooms"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="font-extrabold text-base text-[#4A3E4D] dark:text-[#F8F1FF] flex items-center gap-2">
                  <span>{activeRoom.name}</span>
                  {activeRoom.is_private ? (
                    <Lock className="w-3.5 h-3.5 text-[#C5A7FF]" />
                  ) : (
                    <Globe className="w-3.5 h-3.5 text-[#91E6C1]" />
                  )}
                </h3>
                <p className="text-[11px] text-[#786C7B] dark:text-[#B9AEC9]">
                  {activeRoom.memberCount} members studying together
                </p>
              </div>
            </div>

            {/* Invite Code Pill */}
            <button
              onClick={() => handleCopyCode(activeRoom.invite_code)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF5F8] dark:bg-[#302641] border border-[#F0E4DE] dark:border-[#40354F] text-xs font-bold text-[#FF729F] hover:border-[#FF729F] transition-all cursor-pointer"
              title="Click to copy invite code"
            >
              {copiedCode === activeRoom.invite_code ? (
                <>
                  <Check className="w-3 h-3 text-[#91E6C1]" />
                  <span className="text-[#91E6C1]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Code: {activeRoom.invite_code}</span>
                </>
              )}
            </button>
          </div>

          {/* Members Bar */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {activeRoom.members.map((m) => (
              <div
                key={m.userId}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FFFDF9] dark:bg-[#1D1729] border border-[#F0E4DE] dark:border-[#352B46] shrink-0"
              >
                <div className="relative w-5 h-5 rounded-full overflow-hidden bg-[#FFEBF0] dark:bg-[#302641]">
                  <Image
                    src={m.avatarUrl || "/images/mascot/fumi-idle.webp?v=2"}
                    alt={m.displayName}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                  {m.isStudyingNow && (
                    <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-[#91E6C1] animate-ping" />
                  )}
                </div>
                <span className="text-[11px] font-bold text-[#4A3E4D] dark:text-[#F8F1FF]">
                  {m.displayName}
                </span>
                {m.currentSubject && (
                  <span className="text-[9px] text-[#FF729F] font-bold truncate max-w-[80px]">
                    &bull; {m.currentSubject}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Chat Messages Container */}
          <div className="h-64 overflow-y-auto space-y-3 p-3 rounded-2xl bg-[#FFFDF9] dark:bg-[#1D1729] border border-[#F0E4DE] dark:border-[#352B46]">
            {chatLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-[#A49AAB]">
                <Loader2 className="w-4 h-4 animate-spin text-[#FF729F] mr-2" />
                Connecting to study room chat...
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-[#A49AAB] space-y-1">
                <span>🌸 Room is ready! Send the first encouraging message!</span>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${
                    msg.isCurrentUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!msg.isCurrentUser && (
                    <div className="w-7 h-7 rounded-full bg-[#FFEBF0] dark:bg-[#302641] overflow-hidden relative shrink-0 border border-[#FF729F]/30">
                      <Image
                        src={msg.senderAvatar || "/images/mascot/fumi-idle.webp?v=2"}
                        alt={msg.senderName}
                        fill
                        unoptimized
                        className="object-contain p-0.5"
                      />
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] p-3 rounded-2xl text-xs space-y-0.5 ${
                      msg.isCurrentUser
                        ? "bg-gradient-to-r from-[#FF729F] to-[#F25577] text-white rounded-tr-xs shadow-xs"
                        : "bg-white dark:bg-[#302641] text-[#4A3E4D] dark:text-[#F8F1FF] border border-[#F0E4DE] dark:border-[#40354F] rounded-tl-xs shadow-xs"
                    }`}
                  >
                    {!msg.isCurrentUser && (
                      <p className="text-[10px] font-bold text-[#C5A7FF]">{msg.senderName}</p>
                    )}
                    <p className="leading-relaxed break-words">{msg.content}</p>
                    <p
                      className={`text-[8px] text-right ${
                        msg.isCurrentUser ? "text-white/70" : "text-[#A49AAB]"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reaction Emojis */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-[10px] font-bold text-[#A49AAB] shrink-0">Quick cheer:</span>
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSendMessage(emoji)}
                disabled={sendingMsg}
                className="px-2 py-1 rounded-xl bg-[#FFF5F8] dark:bg-[#302641] hover:scale-115 active:scale-95 transition-all text-xs cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Chat Input Dock */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              maxLength={500}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type an encouraging message... ✨"
              className="flex-1 p-3 rounded-2xl bg-[#FFFDF9] dark:bg-[#1D1729] border border-[#F0E4DE] dark:border-[#40354F] text-xs text-[#4A3E4D] dark:text-[#F8F1FF] focus:outline-hidden focus:ring-2 focus:ring-[#FF729F]"
            />
            <button
              type="submit"
              disabled={sendingMsg || !chatInput.trim()}
              className="p-3 rounded-2xl bg-gradient-to-r from-[#FF729F] to-[#F25577] text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {sendingMsg ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      ) : (
        /* VIEW B: ALL ROOMS LIST & MANAGEMENT */
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0E4DE] dark:border-[#352B46]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#E7E0FA] dark:bg-[#302641] text-[#8B6ED6] dark:text-[#C5A7FF] border border-transparent dark:border-[#40354F]/50">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#4A3E4D] dark:text-[#F8F1FF]">
                  Private Study Circles
                </h3>
                <p className="text-[11px] text-[#786C7B] dark:text-[#B9AEC9]">
                  Create cozy group rooms with live focus feeds & chat
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowJoinInput(!showJoinInput);
                  setJoinError(null);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-[#F0E4DE] dark:border-[#40354F] bg-white dark:bg-[#302641] text-xs font-bold text-[#7D6E7E] dark:text-[#B9AEC9] hover:text-[#FF729F] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Join Code</span>
              </button>

              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setCreateError(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#FF729F] to-[#F25577] text-white text-xs font-bold shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Room</span>
              </button>

              <button
                onClick={loadRooms}
                className="p-2 rounded-xl text-[#A49AAB] hover:text-[#FF729F] transition-all cursor-pointer"
                title="Refresh rooms"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Join with Code Accordion */}
          <AnimatePresence>
            {showJoinInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <form
                  onSubmit={handleJoinRoom}
                  className="p-4 rounded-2xl bg-[#FFF5F8] dark:bg-[#1D1729] border border-[#FF729F]/30 flex items-center gap-2"
                >
                  <input
                    type="text"
                    maxLength={10}
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter 8-character invite code (e.g. K7X9PQ2M)"
                    className="flex-1 p-2.5 rounded-xl bg-white dark:bg-[#241D33] border border-[#F0E4DE] dark:border-[#40354F] text-xs font-mono uppercase text-[#4A3E4D] dark:text-[#F8F1FF] focus:outline-hidden focus:ring-2 focus:ring-[#FF729F]"
                  />
                  <button
                    type="submit"
                    disabled={joining || !joinCodeInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-[#FF729F] text-white text-xs font-bold hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {joining ? "Joining..." : "Join"}
                  </button>
                </form>
                {joinError && (
                  <p className="px-2 text-xs text-[#FF729F] font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{joinError}</span>
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Room Cards Grid */}
          {loading && rooms.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-xs text-[#A49AAB] space-y-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#FF729F]" />
              <span>Loading your study circles...</span>
            </div>
          ) : rooms.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="text-4xl">📚</div>
              <h4 className="text-sm font-black text-[#4A3E4D] dark:text-[#F8F1FF]">
                No Study Rooms Joined Yet
              </h4>
              <p className="text-xs text-[#786C7B] dark:text-[#B9AEC9] max-w-sm">
                Create a private room for your study group or join an existing circle with an invite code!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rooms.map((room) => {
                const studyingCount = room.members.filter((m) => m.isStudyingNow).length;

                return (
                  <div
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1D1729] border border-[#F0E4DE] dark:border-[#352B46] hover:border-[#C5A7FF] hover:scale-102 transition-all cursor-pointer space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-[#4A3E4D] dark:text-[#F8F1FF] truncate">
                          {room.name}
                        </span>
                        {room.is_private && <Lock className="w-3 h-3 text-[#C5A7FF]" />}
                      </div>
                      {studyingCount > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#182B24] text-[9px] font-black text-[#91E6C1] border border-[#234A38]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#91E6C1] animate-ping" />
                          {studyingCount} Live
                        </span>
                      )}
                    </div>

                    {room.description && (
                      <p className="text-[11px] text-[#786C7B] dark:text-[#B9AEC9] line-clamp-2">
                        {room.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-[#F0E4DE] dark:border-[#352B46] text-[10px] text-[#A49AAB]">
                      <span>{room.memberCount} members</span>
                      <span className="text-[#C5A7FF] font-bold">Enter Room &rarr;</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE ROOM MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#241D33] border border-[#F0E4DE] dark:border-[#40354F] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-base font-black text-[#4A3E4D] dark:text-[#F8F1FF]">
                  Create Cozy Study Circle
                </h4>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs text-[#A49AAB] hover:text-[#FF729F] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-3">
                {createError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FFEBF0] dark:bg-[#381E2B] border border-[#FFCAD6] dark:border-[#6A3249] text-[#D83A66] dark:text-[#FFAAB9] text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#FF729F]" />
                    <span>{createError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#4A3E4D] dark:text-[#B9AEC9] mb-1">
                    Room Name (e.g. &ldquo;Late Night LeetCoders 🌙&rdquo;):
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Enter study circle name..."
                    className="w-full p-2.5 rounded-xl bg-[#FFFDF9] dark:bg-[#1D1729] border border-[#F0E4DE] dark:border-[#40354F] text-xs text-[#4A3E4D] dark:text-[#F8F1FF] focus:outline-hidden focus:ring-2 focus:ring-[#FF729F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E4D] dark:text-[#B9AEC9] mb-1">
                    Description / Focus Goal:
                  </label>
                  <textarea
                    rows={2}
                    maxLength={200}
                    value={newRoomDesc}
                    onChange={(e) => setNewRoomDesc(e.target.value)}
                    placeholder="What will this circle focus on together?"
                    className="w-full p-2.5 rounded-xl bg-[#FFFDF9] dark:bg-[#1D1729] border border-[#F0E4DE] dark:border-[#40354F] text-xs text-[#4A3E4D] dark:text-[#F8F1FF] focus:outline-hidden focus:ring-2 focus:ring-[#FF729F]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={newRoomPrivate}
                    onChange={(e) => setNewRoomPrivate(e.target.checked)}
                    className="rounded text-[#FF729F] focus:ring-[#FF729F]"
                  />
                  <label
                    htmlFor="isPrivate"
                    className="text-xs text-[#786C7B] dark:text-[#B9AEC9] cursor-pointer"
                  >
                    Private room (join via invite code only)
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#7D6E7E] dark:text-[#B9AEC9] hover:bg-gray-100 dark:hover:bg-[#302641]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newRoomName.trim()}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF729F] to-[#F25577] text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create Room"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

