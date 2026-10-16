"use client";

import React, { useState } from "react";
import {
  Radio,
  Calendar,
  Trophy,
  Gift,
  Home,
  Sparkles,
  Heart,
  Clock,
  Flame,
} from "lucide-react";
import { FumiMascot } from "@/components/ui/FumiMascot";

export const FeaturesGridSection: React.FC = () => {
  const [selectedGift, setSelectedGift] = useState("boba");

  return (
    <section className="py-16 sm:py-24 bg-[#FFFDF9] dark:bg-[#171321] relative transition-colors" id="features">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 relative">
          <span className="text-xl inline-block mb-1">⭐</span>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#4A3E4D] dark:text-[#F8F1FF] leading-tight">
            Everything you need <br />
            for a happier study journey{" "}
            <span className="text-[#FF729F] font-light">♡</span>
          </h2>

          <div className="hidden sm:inline-flex items-center gap-1.5 absolute -top-4 -right-10 transform rotate-6 bg-white dark:bg-[#241D33] px-3.5 py-1 rounded-full border border-[#F5E6ED] dark:border-[#40354F] shadow-xs text-[11px] font-bold text-[#8C7B8E] dark:text-[#B9AEC9]">
            <span>Little Steps Big Dreams</span>
            <Heart className="w-3 h-3 text-[#FF729F] fill-[#FF729F]" />
          </div>
        </div>

        {/* 6 Rich Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Live Updates */}
          <div className="hover-lift flex flex-col p-6 rounded-3xl bg-white dark:bg-[#241D33] border border-[#F2E8E2] dark:border-[#40354F] hover:border-[#FFD0DE] dark:hover:border-[#C5A7FF]/50 shadow-xs hover:shadow-xl hover:shadow-pink-500/10 dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.5),0_0_20px_rgba(197,167,255,0.15)] group cursor-pointer transition-colors">
            <div className="h-36 rounded-2xl bg-gradient-to-br from-[#FFF0F5] to-[#FFEBF1] dark:from-[#302641] dark:to-[#4A263D]/60 p-4 flex flex-col justify-between mb-5 border border-[#F8E2EC] dark:border-[#40354F]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF476E] text-white text-[10px] font-extrabold shadow-xs">
                  <Radio className="w-3 h-3 animate-pulse" /> LIVE
                </span>
                <span className="text-xs font-bold text-[#8C7B8E] dark:text-[#B9AEC9]">
                  Synced to Server
                </span>
              </div>

              <div className="flex items-center justify-center gap-3">
                <div className="hover-lift-pill w-10 h-10 rounded-full bg-white dark:bg-[#241D33] flex items-center justify-center text-lg shadow-2xs border border-transparent dark:border-[#40354F] group-hover:scale-110 transition-transform">
                  🌸
                </div>
                <div className="text-left">
                  <div className="text-xs font-extrabold text-[#4A3E4D] dark:text-[#F8F1FF] group-hover:text-[#FF729F] transition-colors">
                    Study Stream
                  </div>
                  <div className="font-mono text-sm font-bold text-[#FF729F]">
                    00:54:19
                  </div>
                </div>
              </div>
            </div>

            <h3 className="font-display text-base font-bold text-[#4A3E4D] dark:text-[#F8F1FF] mb-1.5 group-hover:text-[#FF729F] transition-colors">
              Live Updates
            </h3>
            <p className="text-xs text-[#8C7B8E] dark:text-[#B9AEC9] leading-relaxed">
              See when your friends are studying, second by second, without needing to manually refresh.
            </p>
          </div>

          {/* Card 2: Personal 24-Hour Day */}
          <div className="hover-lift flex flex-col p-6 rounded-3xl bg-white dark:bg-[#241D33] border border-[#F2E8E2] dark:border-[#40354F] hover:border-[#FFE5B5] dark:hover:border-[#C5A7FF]/50 shadow-xs hover:shadow-xl hover:shadow-amber-500/10 dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.5),0_0_20px_rgba(246,210,139,0.15)] group cursor-pointer transition-colors">
            <div className="h-36 rounded-2xl bg-gradient-to-br from-[#FFF9ED] to-[#FFF3DC] dark:from-[#302641] dark:to-[#45361D]/60 p-4 flex flex-col justify-between mb-5 border border-[#F8ECD2] dark:border-[#40354F]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D99B16] dark:bg-[#F6D28B] text-white dark:text-[#171321] text-[10px] font-extrabold shadow-xs">
                  <Calendar className="w-3 h-3" /> 24H Window
                </span>
                <span className="text-xs font-bold text-[#8C7B8E] dark:text-[#B9AEC9]">
                  Your Rules
                </span>
              </div>

              <div className="bg-white/90 dark:bg-[#241D33] p-2.5 rounded-xl border border-[#F4E3C2] dark:border-[#40354F] flex items-center justify-between text-xs font-bold text-[#4A3E4D] dark:text-[#F8F1FF] group-hover:shadow-xs transition-shadow">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#D99B16] dark:text-[#F6D28B] group-hover:rotate-12 transition-transform" />
                  <span>Day Starts: 06:00 AM</span>
                </div>
                <span className="text-[10px] text-[#2EB562] dark:text-[#91E6C1] bg-[#EAF7EE] dark:bg-[#1A3826] px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              </div>
            </div>

            <h3 className="font-display text-base font-bold text-[#4A3E4D] dark:text-[#F8F1FF] mb-1.5 group-hover:text-[#D99B16] dark:group-hover:text-[#F6D28B] transition-colors">
              Personal 24-Hour Day
            </h3>
            <p className="text-xs text-[#8C7B8E] dark:text-[#B9AEC9] leading-relaxed">
              Set your own study day start time. Midnight never wipes your streak or splits your sessions unfairly!
            </p>
          </div>

          {/* Card 3: Compete & Grow */}
          <div className="hover-lift flex flex-col p-6 rounded-3xl bg-white dark:bg-[#241D33] border border-[#F2E8E2] dark:border-[#40354F] hover:border-[#D5E4FF] dark:hover:border-[#C5A7FF]/50 shadow-xs hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.5),0_0_20px_rgba(139,180,250,0.15)] group cursor-pointer transition-colors">
            <div className="h-36 rounded-2xl bg-gradient-to-br from-[#EFF5FF] to-[#E5EDFA] dark:from-[#302641] dark:to-[#203254]/60 p-4 flex flex-col justify-between mb-5 border border-[#DCE8F8] dark:border-[#40354F]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3B7AE8] text-white text-[10px] font-extrabold shadow-xs">
                  <Trophy className="w-3 h-3 group-hover:scale-125 transition-transform" /> Fair Ranking
                </span>
                <span className="text-xs font-bold text-[#8C7B8E] dark:text-[#B9AEC9]">
                  Friend Group
                </span>
              </div>

              {/* Mini Podium */}
              <div className="flex items-end justify-center gap-3">
                <div className="hover-lift-sm flex flex-col items-center">
                  <span className="text-[10px] font-bold text-[#4A3E4D] dark:text-[#F8F1FF]">Aarav</span>
                  <div className="w-12 h-10 bg-white/90 dark:bg-[#241D33] rounded-t-lg border border-[#D5E3F5] dark:border-[#40354F] flex items-center justify-center text-xs font-black text-[#8C7B8E] dark:text-[#B9AEC9]">
                    2nd
                  </div>
                </div>
                <div className="hover-lift-sm flex flex-col items-center">
                  <span className="text-[10px] font-bold text-[#FF729F]">Bestie 👑</span>
                  <div className="w-12 h-14 bg-[#FF729F] text-white rounded-t-lg flex items-center justify-center text-xs font-black shadow-xs">
                    1st
                  </div>
                </div>
                <div className="hover-lift-sm flex flex-col items-center">
                  <span className="text-[10px] font-bold text-[#4A3E4D] dark:text-[#F8F1FF]">You</span>
                  <div className="w-12 h-8 bg-white/90 dark:bg-[#241D33] rounded-t-lg border border-[#D5E3F5] dark:border-[#40354F] flex items-center justify-center text-xs font-black text-[#8C7B8E] dark:text-[#B9AEC9]">
                    3rd
                  </div>
                </div>
              </div>
            </div>

            <h3 className="font-display text-base font-bold text-[#4A3E4D] dark:text-[#F8F1FF] mb-1.5 group-hover:text-[#3B7AE8] dark:group-hover:text-[#8BB4FA] transition-colors">
              Compete & Grow
            </h3>
            <p className="text-xs text-[#8C7B8E] dark:text-[#B9AEC9] leading-relaxed">
              Daily, weekly, and custom leaderboards with friends with verified focused seconds.
            </p>
          </div>

          {/* Card 4: Send Gifts */}
          <div className="hover-lift flex flex-col p-6 rounded-3xl bg-white dark:bg-[#241D33] border border-[#F2E8E2] dark:border-[#40354F] hover:border-[#FFD2EB] dark:hover:border-[#C5A7FF]/50 shadow-xs hover:shadow-xl hover:shadow-pink-500/10 dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.5),0_0_20px_rgba(255,114,159,0.15)] group cursor-pointer transition-colors">
            <div className="h-36 rounded-2xl bg-gradient-to-br from-[#FFF2F9] to-[#FCEAF4] dark:from-[#302641] dark:to-[#4A263D]/60 p-4 flex flex-col justify-between mb-5 border border-[#F7DFEE] dark:border-[#40354F]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF729F] text-white text-[10px] font-extrabold shadow-xs">
                  <Gift className="w-3 h-3 group-hover:scale-125 transition-transform" /> Virtual Goodies
                </span>
                <span className="text-xs font-bold text-[#FF729F]">
                  240 Coins 🪙
                </span>
              </div>

              {/* Interactive gift selector */}
              <div className="flex items-center justify-center gap-2">
                {[
                  { id: "boba", icon: "🧋", label: "Boba" },
                  { id: "star", icon: "⭐", label: "Star" },
                  { id: "matcha", icon: "🍵", label: "Tea" },
                  { id: "cake", icon: "🍰", label: "Cake" },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGift(g.id)}
                    className={`hover-lift-pill w-10 h-10 rounded-xl flex flex-col items-center justify-center text-base transition-all cursor-pointer ${
                      selectedGift === g.id
                        ? "bg-[#FF729F] text-white shadow-xs scale-105"
                        : "bg-white dark:bg-[#241D33] text-[#4A3E4D] dark:text-[#F8F1FF] border border-[#F0DCE8] dark:border-[#40354F]"
                    }`}
                  >
                    <span>{g.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            <h3 className="font-display text-base font-bold text-[#4A3E4D] dark:text-[#F8F1FF] mb-1.5 group-hover:text-[#FF729F] transition-colors">
              Send Gifts
            </h3>
            <p className="text-xs text-[#8C7B8E] dark:text-[#B9AEC9] leading-relaxed">
              Virtual gifts, cute notes and surprise goodies sent to your study besties to cheer them up!
            </p>
          </div>

          {/* Card 5: Study Rooms */}
          <div className="hover-lift flex flex-col p-6 rounded-3xl bg-white dark:bg-[#241D33] border border-[#F2E8E2] dark:border-[#40354F] hover:border-[#BEE8F8] dark:hover:border-[#C5A7FF]/50 shadow-xs hover:shadow-xl hover:shadow-sky-500/10 dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.5),0_0_20px_rgba(136,199,247,0.15)] group cursor-pointer transition-colors">
            <div className="h-36 rounded-2xl bg-gradient-to-br from-[#EBF7FF] to-[#DDF1FC] dark:from-[#302641] dark:to-[#1E3247]/60 p-4 flex flex-col justify-between mb-5 border border-[#CCE8F8] dark:border-[#40354F]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2B95E0] dark:bg-[#88C7F7] text-white dark:text-[#171321] text-[10px] font-extrabold shadow-xs">
                  <Home className="w-3 h-3 group-hover:scale-125 transition-transform" /> Cozy Sanctuary
                </span>
                <span className="text-xs font-bold text-[#2B95E0] dark:text-[#88C7F7]">
                  Private Room
                </span>
              </div>

              <div className="bg-white/90 dark:bg-[#241D33] p-2.5 rounded-xl border border-[#CCE4F5] dark:border-[#40354F] flex items-center justify-between text-xs group-hover:shadow-xs transition-shadow">
                <div className="flex items-center gap-2">
                  <span className="text-base group-hover:scale-125 group-hover:rotate-12 transition-transform">☕</span>
                  <span className="font-bold text-[#4A3E4D] dark:text-[#F8F1FF]">Study Hall #04</span>
                </div>
                <span className="text-[10px] font-bold text-[#2B95E0] dark:text-[#88C7F7] bg-[#E8F4FC] dark:bg-[#1C334A] px-2 py-0.5 rounded-full">
                  4 Besties
                </span>
              </div>
            </div>

            <h3 className="font-display text-base font-bold text-[#4A3E4D] dark:text-[#F8F1FF] mb-1.5 group-hover:text-[#2B95E0] dark:group-hover:text-[#88C7F7] transition-colors">
              Study Rooms
            </h3>
            <p className="text-xs text-[#8C7B8E] dark:text-[#B9AEC9] leading-relaxed">
              Focus together with real-time text chat, ambient sounds, shared session goals, and encouragement.
            </p>
          </div>

          {/* Card 6: Your Companion */}
          <div className="hover-lift flex flex-col p-6 rounded-3xl bg-white dark:bg-[#241D33] border border-[#F2E8E2] dark:border-[#40354F] hover:border-[#C4F0D2] dark:hover:border-[#C5A7FF]/50 shadow-xs hover:shadow-xl hover:shadow-emerald-500/10 dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.5),0_0_20px_rgba(145,230,193,0.15)] group cursor-pointer transition-colors">
            <div className="h-36 rounded-2xl bg-gradient-to-br from-[#EDF9F1] to-[#E1F5E8] dark:from-[#302641] dark:to-[#1A3826]/60 p-4 flex flex-col justify-between mb-5 border border-[#D2EEDC] dark:border-[#40354F]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2EB562] dark:bg-[#91E6C1] text-white dark:text-[#171321] text-[10px] font-extrabold shadow-xs">
                  <Sparkles className="w-3 h-3 group-hover:scale-125 transition-transform" /> Fumi Mascot
                </span>
                <span className="text-xs font-bold text-[#2EB562] dark:text-[#91E6C1]">
                  Loves Studying
                </span>
              </div>

              <div className="flex items-center justify-center gap-3">
                <div className="p-1 rounded-2xl bg-white/90 dark:bg-white/95 border border-[#D2EEDC] dark:border-[#FF729F]/30 shadow-2xs overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <FumiMascot size={76} state="studying" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-extrabold text-[#4A3E4D] dark:text-[#F8F1FF] group-hover:text-[#2EB562] dark:group-hover:text-[#91E6C1] transition-colors">
                    Evolving Companion
                  </div>
                  <div className="text-[10px] text-[#2EB562] dark:text-[#91E6C1] font-semibold flex items-center gap-1">
                    <Flame className="w-3 h-3 group-hover:animate-bounce" /> High Energy Mood
                  </div>
                </div>
              </div>
            </div>

            <h3 className="font-display text-base font-bold text-[#4A3E4D] dark:text-[#F8F1FF] mb-1.5 group-hover:text-[#2EB562] dark:group-hover:text-[#91E6C1] transition-colors">
              Your Companion
            </h3>
            <p className="text-xs text-[#8C7B8E] dark:text-[#B9AEC9] leading-relaxed">
              The more you study, the happier they get! Unlocks cosmetics and celebrations as you build habits.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
