"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  UserPlus,
  Sparkles,
  Check,
  X,
  Clock,
  BookOpen,
  Loader2,
  Send,
  RotateCw,
} from "lucide-react";
import { useRealtimeFriends } from "@/hooks/useRealtimeFriends";

export function FriendsPresenceWidget() {
  const {
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
  } = useRealtimeFriends();

  const [activeTab, setActiveTab] = useState<"live" | "friends" | "requests">("live");
  const [targetUsername, setTargetUsername] = useState("");
  const [cheerMap, setCheerMap] = useState<Record<string, number>>({});

  const handleSendCheer = (sessionId: string) => {
    setCheerMap((prev) => ({
      ...prev,
      [sessionId]: (prev[sessionId] || 0) + 1,
    }));
    setTimeout(() => {
      setCheerMap((prev) => {
        const next = { ...prev };
        delete next[sessionId];
        return next;
      });
    }, 1500);
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername.trim()) return;
    const ok = await sendRequest(targetUsername.trim());
    if (ok) setTargetUsername("");
  };

  const activeCount = activeSessions.filter((s) => s.state === "active").length;
  const requestsCount = pendingIncoming.length;

  return (
    <div className="rounded-3xl bg-white/90 dark:bg-[#241D33]/90 border border-[#F0E4DE] dark:border-[#40354F] shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl p-5 sm:p-6 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#F0E4DE] dark:border-[#352B46]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-[#FFEBF0] dark:bg-[#4A263D] text-[#FF729F]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-[#4A3E4D] dark:text-[#F8F1FF] flex items-center gap-2">
              <span>Study Buddies Room</span>
              {activeCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EAF5EE] dark:bg-[#1A3826] text-[10px] font-black text-[#2E7D4E] dark:text-[#91E6C1]">
                  <span className="w-2 h-2 rounded-full bg-[#2E7D4E] dark:bg-[#91E6C1] animate-ping" />
                  {activeCount} Live
                </span>
              )}
            </h3>
            <p className="text-[11px] text-[#786C7B] dark:text-[#C5BAD3]">
              Real-time co-studying via Supabase Realtime
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center p-1 rounded-2xl bg-[#FFF5F8] dark:bg-[#1D1729] border border-[#F0E4DE] dark:border-[#40354F]">
          <button
            onClick={() => setActiveTab("live")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "live"
                ? "bg-white dark:bg-[#2E243E] text-[#FF729F] shadow-xs"
                : "text-[#7D6E7E] dark:text-[#B9AEC9]"
            }`}
          >
            Live ({activeSessions.length})
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "friends"
                ? "bg-white dark:bg-[#2E243E] text-[#FF729F] shadow-xs"
                : "text-[#7D6E7E] dark:text-[#B9AEC9]"
            }`}
          >
            Buddies ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`relative px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "requests"
                ? "bg-white dark:bg-[#2E243E] text-[#FF729F] shadow-xs"
                : "text-[#7D6E7E] dark:text-[#B9AEC9]"
            }`}
          >
            <span>Add / Invites</span>
            {requestsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF729F] text-white text-[9px] font-black flex items-center justify-center">
                {requestsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => refresh()}
            className="p-1 rounded-xl text-[#A49AAB] hover:text-[#FF729F] transition-all cursor-pointer"
            title="Refresh room"
          >
            <RotateCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Status Messages */}
      <AnimatePresence>
        {(error || successMessage) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`mt-3 p-3 rounded-2xl text-xs flex items-center justify-between ${
              error
                ? "bg-[#FFF0F0] dark:bg-[#3D1E22] text-[#D32F2F] dark:text-[#FF8A80] border border-[#FFCDD2]"
                : "bg-[#EAF5EE] dark:bg-[#1A3826] text-[#2E7D4E] dark:text-[#91E6C1] border border-[#A5D6A7]"
            }`}
          >
            <span>{error || successMessage}</span>
            <button
              onClick={clearMessages}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Body */}
      <div className="mt-4 min-h-[220px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-2 text-[#A49AAB]">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF729F]" />
            <p className="text-xs">Connecting to Cozy Study Room...</p>
          </div>
        ) : activeTab === "live" ? (
          /* TAB 1: LIVE ACTIVE SESSIONS */
          activeSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="relative w-20 h-20 opacity-80">
                <Image
                  src="/images/mascot/fumi-sleeping.webp"
                  alt="Fumi relaxing"
                  fill
                  sizes="80px"
                  className="object-contain"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#4A3E4D] dark:text-[#F8F1FF]">
                  No buddies studying right now
                </p>
                <p className="text-[11px] text-[#786C7B] dark:text-[#C5BAD3] max-w-xs">
                  Start your focus timer, or invite friends to join your live study circle! 🌸
                </p>
              </div>
              <button
                onClick={() => setActiveTab("requests")}
                className="mt-1 px-4 py-1.5 rounded-full bg-[#FFEBF0] dark:bg-[#4A263D] hover:bg-[#FFD5DF] text-[#FF729F] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite a Friend</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="relative p-4 rounded-2xl bg-gradient-to-r from-[#FFF5F8] to-[#F8F4FF] dark:from-[#2B213A] dark:to-[#1E172B] border border-[#FFD5DF]/70 dark:border-[#40354F] flex items-center justify-between gap-3 shadow-xs"
                >
                  {/* Left: Avatar + Details */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-2xl bg-white dark:bg-[#1D1729] border border-[#FF729F]/40 overflow-hidden flex items-center justify-center shrink-0">
                      <Image
                        src={session.avatarUrl || "/images/mascot/fumi-headphones.webp"}
                        alt={session.username}
                        fill
                        sizes="44px"
                        className="object-contain p-1"
                      />
                      {/* Active green pulse dot */}
                      <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-[#34D399] border-2 border-white dark:border-[#1D1729]" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-[#4A3E4D] dark:text-[#F8F1FF]">
                          {session.displayName || `@${session.username}`}
                        </span>
                        <span className="text-[10px] text-[#A49AAB]">@{session.username}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FFEBF0] dark:bg-[#4A263D] text-[10px] font-bold text-[#FF729F]">
                          <BookOpen className="w-2.5 h-2.5" />
                          {session.subjectTag}
                        </span>

                        <span className="text-[10px] font-medium text-[#786C7B] dark:text-[#C5BAD3] flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {session.state === "active" ? (
                            <span className="text-[#2E7D4E] dark:text-[#91E6C1] font-bold">
                              {Math.round(session.accumulatedSeconds / 60)}m in zone
                            </span>
                          ) : (
                            <span className="text-[#D99B16]">Taking a break ☕</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Cheer Button */}
                  <div className="relative">
                    <button
                      onClick={() => handleSendCheer(session.sessionId)}
                      className="p-2 rounded-xl bg-white dark:bg-[#1D1729] border border-[#E9DFD8] dark:border-[#40354F] hover:border-[#FF729F] text-[#FF729F] hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-xs"
                      title="Send a cheer sparkle!"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>

                    {/* Floating Cheer Sparkle Animation */}
                    <AnimatePresence>
                      {cheerMap[session.sessionId] && (
                        <motion.div
                          initial={{ opacity: 0, y: 0, scale: 0.5 }}
                          animate={{ opacity: 1, y: -28, scale: 1.3 }}
                          exit={{ opacity: 0 }}
                          className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none text-sm z-20"
                        >
                          💖✨
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === "friends" ? (
          /* TAB 2: ALL BUDDIES LIST */
          friends.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-xs font-bold text-[#4A3E4D] dark:text-[#F8F1FF]">
                You haven&apos;t added any study buddies yet!
              </p>
              <p className="text-[11px] text-[#786C7B] dark:text-[#C5BAD3]">
                Studying is more fun with friends. Switch to the &ldquo;Add / Invites&rdquo; tab to connect.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {friends.map((friend) => (
                <div
                  key={friend.friendshipId}
                  className="p-3 rounded-2xl bg-[#FFFDF9] dark:bg-[#1D1729] border border-[#E9DFD8] dark:border-[#40354F] flex items-center gap-3"
                >
                  <div className="relative w-10 h-10 rounded-xl bg-[#FFEBF0] dark:bg-[#3D1E30] overflow-hidden shrink-0">
                    <Image
                      src={friend.avatarUrl || "/images/mascot/fumi-idle.webp"}
                      alt={friend.username}
                      fill
                      sizes="40px"
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-[#4A3E4D] dark:text-[#F8F1FF]">
                      {friend.displayName || `@${friend.username}`}
                    </p>
                    <p className="text-[10px] text-[#A49AAB] truncate">@{friend.username}</p>
                    <p className="text-[9px] text-[#786C7B] dark:text-[#C5BAD3]">
                      Zone: {friend.timezone}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* TAB 3: ADD FRIEND & PENDING INVITES */
          <div className="space-y-5">
            {/* Send Friend Request Form */}
            <form onSubmit={handleAddFriend} className="space-y-2">
              <label className="block text-xs font-bold text-[#4A3E4D] dark:text-[#F8F1FF]">
                Add Study Buddy by Username
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value)}
                    placeholder="Enter friend's exact username (e.g. mohit_study)"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFFDF9] dark:bg-[#1D1729] border border-[#E9DFD8] dark:border-[#40354F] text-xs text-[#4A3E4D] dark:text-[#F8F1FF] placeholder-[#A49AAB] focus:outline-hidden focus:border-[#FF729F] transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading || !targetUsername.trim()}
                  className="px-4 py-2.5 rounded-2xl bg-[#FF729F] hover:bg-[#F25577] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {actionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Send</span>
                </button>
              </div>
            </form>

            {/* Incoming Requests */}
            {pendingIncoming.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#FF729F] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Incoming Friend Requests ({pendingIncoming.length})</span>
                </h4>
                <div className="space-y-2">
                  {pendingIncoming.map((req) => (
                    <div
                      key={req.friendshipId}
                      className="p-3 rounded-2xl bg-[#FFEBF0]/50 dark:bg-[#4A263D]/40 border border-[#FFD5DF] dark:border-[#523363] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white dark:bg-[#1D1729] shrink-0">
                          <Image
                            src={req.avatarUrl || "/images/mascot/fumi-idle.webp"}
                            alt={req.username}
                            fill
                            sizes="32px"
                            className="object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#4A3E4D] dark:text-[#F8F1FF] truncate">
                            {req.displayName || req.username}
                          </p>
                          <p className="text-[10px] text-[#786C7B] dark:text-[#C5BAD3]">
                            @{req.username}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => respondRequest(req.friendshipId, "accept")}
                          disabled={actionLoading}
                          className="px-3 py-1 rounded-xl bg-[#2E7D4E] hover:bg-[#256841] text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Check className="w-3 h-3" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => respondRequest(req.friendshipId, "reject")}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#1D1729] border border-[#E9DFD8] dark:border-[#40354F] text-[#A49AAB] hover:text-[#D32F2F] text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outgoing Requests */}
            {pendingOutgoing.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-[#F0E4DE] dark:border-[#352B46]">
                <h4 className="text-[11px] font-bold text-[#A49AAB]">
                  Outgoing Requests ({pendingOutgoing.length})
                </h4>
                <div className="space-y-1">
                  {pendingOutgoing.map((req) => (
                    <div
                      key={req.friendshipId}
                      className="px-3 py-2 rounded-xl bg-[#FFFDF9] dark:bg-[#1D1729] border border-[#E9DFD8] dark:border-[#40354F] flex items-center justify-between text-xs"
                    >
                      <span className="text-[#4A3E4D] dark:text-[#F8F1FF] font-medium">
                        @{req.username}
                      </span>
                      <span className="text-[10px] text-[#A49AAB] italic">Pending response...</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
