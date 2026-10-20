"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  Flame,
  Clock,
  Sparkles,
  RotateCw,
  Crown,
  Medal,
  Users,
  Calendar,
  Zap,
  Info,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import type { LeaderboardMode, LeaderboardResult } from "@/app/actions/leaderboard";
import { formatFocusedTime } from "@/lib/time/study-day";

interface LeaderboardWidgetProps {
  onInviteFriends?: () => void;
  initialData?: LeaderboardResult | null;
  previewMode?: boolean;
}

export function LeaderboardWidget({
  onInviteFriends,
  initialData,
  previewMode = false,
}: LeaderboardWidgetProps) {
  const { mode, setMode, data, loading, error, rankUpMessage, refresh } =
    useLeaderboard("personal_day", !previewMode);
  const [showInfo, setShowInfo] = useState(false);

  const activeData = previewMode ? initialData : (data || initialData);
  const rankings = activeData?.rankings || [];
  const maxSeconds = rankings[0]?.focusedSeconds || 1;
  const userWindow = activeData?.userWindow;
  const isLoading = !previewMode && loading && !initialData;

  // Podium participants (top 3)
  const top1 = rankings.find((r) => r.rank === 1);
  const top2 = rankings.find((r) => r.rank === 2);
  const top3 = rankings.find((r) => r.rank === 3);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#F6D28B] to-[#FFE8A3] text-[#4A3205] font-black text-xs flex items-center justify-center shadow-xs border border-[#FFF1C2]">
            🥇
          </div>
        );
      case 2:
        return (
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#E0E2EC] to-[#F4F5F8] text-[#333842] font-black text-xs flex items-center justify-center shadow-xs border border-white">
            🥈
          </div>
        );
      case 3:
        return (
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#E6B89C] to-[#F7D8C4] text-[#4A2612] font-black text-xs flex items-center justify-center shadow-xs border border-[#FFE1D1]">
            🥉
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-full bg-[#FFF5F8] dark:bg-[#302641] text-[#7D6E7E] dark:text-[#B9AEC9] font-black text-xs flex items-center justify-center border border-[#F0E4DE] dark:border-[#40354F]">
            #{rank}
          </div>
        );
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-[#241D33] border border-[#F0E4DE] dark:border-[#40354F] shadow-xl dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)] p-6 sm:p-7 lg:p-8 transition-colors relative overflow-hidden">
      {/* Top Ambient Glow Accent */}
      <div className="absolute top-0 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-[#F6D28B]/60 to-transparent pointer-events-none" />

      {/* Rank Up Level Celebration Notification */}
      <AnimatePresence>
        {rankUpMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-[#FF729F]/20 via-[#F6D28B]/20 to-[#91E6C1]/20 border border-[#FF729F]/40 flex items-center justify-between text-xs font-black text-[#F8F1FF]"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F6D28B] animate-spin" />
              <span>{rankUpMessage}</span>
            </div>
            <span className="text-[10px] text-[#91E6C1]">Fumi is proud! 💖</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header: Title, Live Status, and Mode Switchers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#F0E4DE] dark:border-[#352B46]">
        {/* Title Area */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#FFF8E5] dark:bg-[#3D2C1B] text-[#D99B16] dark:text-[#F6D28B] border border-transparent dark:border-[#5E4426]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-[#4A3E4D] dark:text-[#F8F1FF]">
                Cozy Study Leaderboard
              </h3>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="text-[#A49AAB] hover:text-[#FF729F] transition-colors cursor-pointer"
                title="How fair rankings work"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-[#786C7B] dark:text-[#B9AEC9]">
              Fair time tracking with custom 24h boundaries
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-2xl bg-[#FFF5F8] dark:bg-[#302641] border border-[#F0E4DE] dark:border-[#40354F]">
            <button
              onClick={() => setMode("personal_day")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === "personal_day"
                  ? "bg-white dark:bg-[#241D33] text-[#FF729F] shadow-xs"
                  : "text-[#7D6E7E] dark:text-[#B9AEC9] hover:text-[#4A3E4D] dark:hover:text-[#F8F1FF]"
              }`}
            >
              <span>🌸</span>
              <span className="hidden sm:inline">Personal Day</span>
              <span className="sm:hidden">Day</span>
            </button>
            <button
              onClick={() => setMode("shared_challenge")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === "shared_challenge"
                  ? "bg-white dark:bg-[#241D33] text-[#FF729F] shadow-xs"
                  : "text-[#7D6E7E] dark:text-[#B9AEC9] hover:text-[#4A3E4D] dark:hover:text-[#F8F1FF]"
              }`}
            >
              <span>⚡</span>
              <span className="hidden sm:inline">Shared Sprint</span>
              <span className="sm:hidden">Sprint</span>
            </button>
            <button
              onClick={() => setMode("weekly")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === "weekly"
                  ? "bg-white dark:bg-[#241D33] text-[#FF729F] shadow-xs"
                  : "text-[#7D6E7E] dark:text-[#B9AEC9] hover:text-[#4A3E4D] dark:hover:text-[#F8F1FF]"
              }`}
            >
              <span>📅</span>
              <span className="hidden sm:inline">Weekly</span>
              <span className="sm:hidden">Week</span>
            </button>
          </div>

          <button
            onClick={refresh}
            className="p-2 rounded-xl text-[#A49AAB] hover:text-[#FF729F] hover:bg-[#FFEBF0] dark:hover:bg-[#302641] transition-all cursor-pointer"
            title="Refresh leaderboard"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Info Callout Box */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 rounded-2xl bg-[#FFF5F8] dark:bg-[#1D1729] border border-[#FF729F]/30 text-xs text-[#786C7B] dark:text-[#B9AEC9] space-y-1.5"
          >
            <div className="font-extrabold text-[#FF729F] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>How Focusie Guarantees Fair Competition:</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 leading-relaxed">
              <li>
                <strong>Personal Day Mode:</strong> Each friend’s focus time is calculated over their configured 24-hour cycle (e.g. 06:00 AM to 06:00 AM). Late night study sessions past midnight count toward the current day!
              </li>
              <li>
                <strong>Shared Sprint Mode:</strong> 100% synchronized head-to-head competition across an identical UTC timestamp window for all friends worldwide.
              </li>
              <li>
                <strong>Fair Ties:</strong> If two friends log the exact same time, both receive the same rank medal!
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Measurement Window Banner */}
      {userWindow && (
        <div className="mt-4 p-3 rounded-2xl bg-[#FFFDF9] dark:bg-[#1D1729] border border-[#F0E4DE] dark:border-[#352B46] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#7D6E7E] dark:text-[#B9AEC9]">
            <Clock className="w-3.5 h-3.5 text-[#C5A7FF]" />
            <span>
              Window: <strong className="text-[#4A3E4D] dark:text-[#F8F1FF]">{userWindow.label}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#FFEBF0] dark:bg-[#302641] text-[11px] font-bold text-[#FF729F] border border-[#FF729F]/30">
              ⏳ {formatFocusedTime(userWindow.remainingSeconds)} left
            </span>
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="mt-6">
        {isLoading && rankings.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3 text-[#A49AAB]">
            <Loader2 className="w-7 h-7 animate-spin text-[#FF729F]" />
            <p className="text-xs">Calculating fair study boundaries...</p>
          </div>
        ) : rankings.length === 0 ? (
          /* Empty State */
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative w-28 h-28">
              <div className="absolute inset-2 rounded-full bg-[#F6D28B]/15 blur-2xl pointer-events-none" />
              <Image
                src="/images/mascot/fumi-idle.webp?v=2"
                alt="Fumi study companion"
                fill
                unoptimized
                sizes="112px"
                className="object-contain relative z-10 drop-shadow-[0_8px_20px_rgba(246,210,139,0.25)]"
              />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h4 className="text-base font-black text-[#4A3E4D] dark:text-[#F8F1FF]">
                Start Your First Focus Session! 🌟
              </h4>
              <p className="text-xs text-[#786C7B] dark:text-[#B9AEC9] leading-relaxed">
                You will appear here as soon as you complete your first study block. Invite friends to see each other climb the ranks!
              </p>
            </div>
            {onInviteFriends && (
              <button
                onClick={onInviteFriends}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF729F] to-[#F25577] text-white text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Invite Study Friends</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top 3 Podium (Visual Showcase) */}
            {top1 && rankings.length >= 2 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-4 pb-2 px-1">
                {/* 2nd Place Podium */}
                {top2 ? (
                  <div className="flex flex-col items-center space-y-2 order-1">
                    <div className="relative">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-[#302641] border-2 border-[#E0E2EC] dark:border-[#B9AEC9] overflow-hidden flex items-center justify-center shadow-md">
                        <Image
                          src={top2.avatarUrl || "/images/mascot/fumi-headphones.webp?v=2"}
                          alt={top2.displayName}
                          fill
                          unoptimized
                          sizes="56px"
                          className="object-contain p-1"
                        />
                      </div>
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#E0E2EC] text-[#333842] font-black text-xs flex items-center justify-center border border-white shadow-xs">
                        2
                      </span>
                    </div>
                    <div className="text-center w-full truncate">
                      <p className="text-xs font-black truncate text-[#4A3E4D] dark:text-[#F8F1FF]">
                        {top2.displayName}
                      </p>
                      <p className="text-[11px] font-bold text-[#C5A7FF] font-mono">
                        {top2.formattedTime}
                      </p>
                    </div>
                    <div className="w-full h-14 rounded-t-2xl bg-gradient-to-b from-[#302641] to-[#241D33] border-t border-x border-[#40354F] flex items-center justify-center">
                      <span className="text-sm font-black text-[#B9AEC9]">🥈</span>
                    </div>
                  </div>
                ) : (
                  <div className="order-1" />
                )}

                {/* 1st Place Champion Podium */}
                <div className="flex flex-col items-center space-y-2 order-2 -mt-4">
                  <div className="relative">
                    <Crown className="w-6 h-6 text-[#F6D28B] absolute -top-5 left-1/2 -translate-x-1/2 drop-shadow-md animate-bounce" />
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white dark:bg-[#302641] border-2 border-[#F6D28B] overflow-hidden flex items-center justify-center shadow-lg shadow-[#F6D28B]/20">
                      <Image
                        src={top1.avatarUrl || "/images/mascot/fumi-celebrating.webp?v=2"}
                        alt={top1.displayName}
                        fill
                        unoptimized
                        sizes="72px"
                        className="object-contain p-1"
                      />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-tr from-[#F6D28B] to-[#FFE8A3] text-[#4A3205] font-black text-xs flex items-center justify-center border border-white shadow-xs">
                      1
                    </span>
                  </div>
                  <div className="text-center w-full truncate">
                    <p className="text-xs sm:text-sm font-black truncate text-[#F8F1FF]">
                      {top1.displayName}
                    </p>
                    <p className="text-xs font-black text-[#FF729F] font-mono">
                      {top1.formattedTime}
                    </p>
                  </div>
                  <div className="w-full h-22 rounded-t-2xl bg-gradient-to-b from-[#3D2C1B] to-[#241D33] border-t-2 border-x border-[#F6D28B]/60 flex items-center justify-center shadow-inner">
                    <span className="text-lg font-black text-[#F6D28B]">👑 1st</span>
                  </div>
                </div>

                {/* 3rd Place Podium */}
                {top3 ? (
                  <div className="flex flex-col items-center space-y-2 order-3">
                    <div className="relative">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-[#302641] border-2 border-[#E6B89C] dark:border-[#D19B7C] overflow-hidden flex items-center justify-center shadow-md">
                        <Image
                          src={top3.avatarUrl || "/images/mascot/fumi-idle.webp?v=2"}
                          alt={top3.displayName}
                          fill
                          unoptimized
                          sizes="56px"
                          className="object-contain p-1"
                        />
                      </div>
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#E6B89C] text-[#4A2612] font-black text-xs flex items-center justify-center border border-white shadow-xs">
                        3
                      </span>
                    </div>
                    <div className="text-center w-full truncate">
                      <p className="text-xs font-black truncate text-[#4A3E4D] dark:text-[#F8F1FF]">
                        {top3.displayName}
                      </p>
                      <p className="text-[11px] font-bold text-[#C5A7FF] font-mono">
                        {top3.formattedTime}
                      </p>
                    </div>
                    <div className="w-full h-10 rounded-t-2xl bg-gradient-to-b from-[#302641] to-[#241D33] border-t border-x border-[#40354F] flex items-center justify-center">
                      <span className="text-sm font-black text-[#D19B7C]">🥉</span>
                    </div>
                  </div>
                ) : (
                  <div className="order-3" />
                )}
              </div>
            )}

            {/* Complete Ranking Rows */}
            <div className="space-y-2.5">
              {rankings.map((entry) => {
                const progressWidth = Math.min(
                  100,
                  Math.max(8, Math.round((entry.focusedSeconds / maxSeconds) * 100))
                );

                return (
                  <div
                    key={entry.userId}
                    className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 ${
                      entry.isCurrentUser
                        ? "bg-[#FFEBF0]/70 dark:bg-[#331F33] border-[#FF729F]/60 shadow-md ring-1 ring-[#FF729F]/30"
                        : "bg-white dark:bg-[#1D1729] border-[#F0E4DE] dark:border-[#352B46] hover:border-[#40354F]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 relative z-10">
                      {/* Left: Rank + Avatar + Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        {getRankBadge(entry.rank)}

                        <div className="relative w-10 h-10 rounded-2xl bg-[#FFF5F8] dark:bg-[#302641] border border-[#F0E4DE] dark:border-[#40354F] overflow-hidden flex items-center justify-center shrink-0">
                          <Image
                            src={entry.avatarUrl || "/images/mascot/fumi-idle.webp?v=2"}
                            alt={entry.displayName}
                            fill
                            unoptimized
                            sizes="40px"
                            className="object-contain p-1"
                          />
                          {/* Live green pulse dot if currently in a focus session */}
                          {entry.isStudyingNow && (
                            <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-[#91E6C1] border-2 border-white dark:border-[#241D33] animate-pulse" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-black truncate text-[#4A3E4D] dark:text-[#F8F1FF]">
                              {entry.displayName}
                            </span>
                            {entry.isCurrentUser && (
                              <span className="px-1.5 py-0.2 rounded-md bg-[#FF729F] text-white text-[9px] font-black uppercase tracking-wider">
                                You
                              </span>
                            )}
                            {entry.isStudyingNow && (
                              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-[#182B24] text-[#91E6C1] text-[9px] font-bold border border-[#234A38]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#91E6C1] animate-ping" />
                                Live
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-[#786C7B] dark:text-[#B9AEC9]">
                            <span>@{entry.username}</span>
                            {entry.currentSubject && (
                              <>
                                <span>&bull;</span>
                                <span className="text-[#FF729F] font-bold truncate">
                                  {entry.currentSubject}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Total Time */}
                      <div className="text-right shrink-0">
                        <span className="text-sm sm:text-base font-black text-[#4A3E4D] dark:text-[#F8F1FF] font-mono tabular-nums">
                          {entry.formattedTime}
                        </span>
                      </div>
                    </div>

                    {/* Relative Progress Bar Track */}
                    <div className="mt-2.5 w-full h-1.5 rounded-full bg-[#F0E4DE] dark:bg-[#302641] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          entry.rank === 1
                            ? "bg-gradient-to-r from-[#F6D28B] to-[#FFE8A3]"
                            : entry.isCurrentUser
                            ? "bg-gradient-to-r from-[#FF729F] to-[#F25577]"
                            : "bg-gradient-to-r from-[#C5A7FF] to-[#A78BFA]"
                        }`}
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

