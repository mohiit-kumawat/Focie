"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Play, Pause, RotateCcw, Volume2, Heart, ArrowRight } from "lucide-react";
import { FumiMascot } from "@/components/ui/FumiMascot";

export const HeroSection: React.FC = () => {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, secondsLeft]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(25 * 60);
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 bg-gradient-to-b from-[#FFFDF9] via-[#FFF5F8] to-[#FFF9F5] dark:from-[#171321] dark:via-[#1D1729] dark:to-[#171321] transition-colors">
      {/* Subtle ambient radial glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-[#FFEBF2]/50 dark:bg-[#FF729F]/10 blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-10 w-96 h-96 rounded-full bg-[#EFE8FC]/60 dark:bg-[#C5A7FF]/15 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column (6 cols): Copy, Welcome Mascot & CTA */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            {/* Pill Tag & Fumi Welcome */}
            <div className="flex items-center gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFEBF0] dark:bg-[#4A263D] border border-[#FFD5DF] dark:border-[#6A3756] text-xs sm:text-sm font-semibold text-[#D84A6E] dark:text-[#FF729F] shadow-2xs">
                <span>A cozier way to stay consistent</span>
                <Sparkles className="w-4 h-4 text-[#FF729F]" />
              </div>

              <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#241D33] border border-[#F3E2EA] dark:border-[#40354F] text-xs font-bold text-[#514453] dark:text-[#F8F1FF] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#2EB562] dark:bg-[#91E6C1]" />
                <span>Meet Fumi ♡</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-[#4A3E4D] dark:text-[#F8F1FF] leading-[1.12]">
              Focus feels <br className="hidden sm:inline" />
              better <span className="text-[#FF537A] dark:text-[#FF729F]">together.</span>
              <span className="text-[#FF537A] dark:text-[#FF729F] font-light ml-2">♡</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-[#766677] dark:text-[#B9AEC9] leading-relaxed max-w-lg">
              A cute study space for you and your friends. Track study time,
              compete, send virtual gifts, and watch your little companion grow
              with every session!
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold text-white bg-[#FF729F] hover:bg-[#F25577] dark:hover:bg-[#FF5D8F] rounded-full shadow-md hover:shadow-lg transition-all active:scale-98"
              >
                <span>Start for free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-base font-bold text-[#4A3E4D] dark:text-[#F8F1FF] bg-white dark:bg-[#241D33] hover:bg-[#FAF6F2] dark:hover:bg-[#302641] border border-[#E9DFD8] dark:border-[#40354F] rounded-full shadow-2xs hover:shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <span className="w-6 h-6 rounded-full bg-[#FFEBF0] dark:bg-[#4A263D] text-[#FF537A] dark:text-[#FF729F] flex items-center justify-center text-xs font-bold pl-0.5">
                  ▶
                </span>
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Social Proof */}
            <div className="mt-8 flex items-center gap-3.5">
              <div className="flex items-center -space-x-2">
                <span className="w-8 h-8 rounded-full bg-[#FFE0EB] dark:bg-[#4A263D] border-2 border-white dark:border-[#171321] flex items-center justify-center text-xs shadow-2xs">
                  🌸
                </span>
                <span className="w-8 h-8 rounded-full bg-[#E5EDFB] dark:bg-[#2A3756] border-2 border-white dark:border-[#171321] flex items-center justify-center text-xs shadow-2xs">
                  🍵
                </span>
                <span className="w-8 h-8 rounded-full bg-[#FDF1D6] dark:bg-[#473B25] border-2 border-white dark:border-[#171321] flex items-center justify-center text-xs shadow-2xs">
                  🐱
                </span>
                <span className="w-8 h-8 rounded-full bg-[#EBF7EF] dark:bg-[#1E3B29] border-2 border-white dark:border-[#171321] flex items-center justify-center text-xs font-bold text-[#2EB562] dark:text-[#91E6C1] shadow-2xs">
                  +3k
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#8C7B8E] dark:text-[#B9AEC9]">
                Join thousands of study besties building better habits! ♡
              </p>
            </div>
          </div>

          {/* Right Column (6 cols): Prominent Fumi in Timer Preview */}
          <div className="lg:col-span-6 relative flex justify-center">
            {/* The Study Room Card */}
            <div className="relative w-full max-w-[500px] rounded-3xl bg-gradient-to-br from-[#FFF5F8] via-white to-[#F6F0FA] dark:from-[#241D33] dark:via-[#1D1729] dark:to-[#241D33] border-2 border-white dark:border-[#40354F] shadow-xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-6 sm:p-7 backdrop-blur-sm transition-all">
              {/* Top Room Banner Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-[#F2E4EC] dark:border-[#40354F]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FF7F9A]" />
                  <span className="w-3 h-3 rounded-full bg-[#F6D28B]" />
                  <span className="w-3 h-3 rounded-full bg-[#91E6C1]" />
                  <span className="ml-2 font-display text-xs font-bold text-[#514453] dark:text-[#F8F1FF]">
                    Sunset Lo-Fi Study Room 🌸
                  </span>
                </div>

                <div className="hover-lift-pill flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-[#302641] hover:bg-white dark:hover:bg-[#3E3154] border border-[#F2E0EB] dark:border-[#40354F] hover:border-[#FF729F]/50 dark:hover:border-[#C5A7FF]/50 text-[11px] font-semibold text-[#7D6E7E] dark:text-[#B9AEC9] cursor-pointer group select-none shadow-2xs hover:shadow-xs">
                  <Volume2 className="w-3.5 h-3.5 text-[#FF729F] group-hover:scale-110 transition-transform" />
                  <span>Rainy Sunset Vibe</span>
                </div>
              </div>

              {/* Center Interactive Session Display */}
              <div className="py-6 flex flex-col items-center text-center">
                {/* Prominent Fumi Focal Point with soft pedestal glow */}
                <div className="hover-lift-sm relative mb-3 flex items-center justify-center p-3 rounded-3xl bg-white/90 dark:bg-white/95 border-2 border-white/80 dark:border-[#FF729F]/30 shadow-md cursor-pointer overflow-hidden group">
                  <FumiMascot
                    size={180}
                    state={isRunning ? "headphones" : "studying"}
                    priority
                    className="group-hover:scale-105 transition-transform duration-300"
                  />
                  {isRunning && (
                    <span className="absolute -top-1 -right-2 px-2.5 py-0.5 rounded-full bg-[#FF729F] text-white text-[10px] font-extrabold shadow-sm animate-pulse">
                      FOCUSING
                    </span>
                  )}
                </div>

                {/* Big Crisp Countdown Timer */}
                <div className="font-mono text-5xl font-black text-[#4A3E4D] dark:text-[#F8F1FF] tracking-tight mb-2 drop-shadow-2xs">
                  {formatTime(secondsLeft)}
                </div>

                <p className="text-xs text-[#8C7B8E] dark:text-[#B9AEC9] font-medium mb-5">
                  {isRunning
                    ? "Deep focus session in progress • Fumi is studying with you!"
                    : "Ready to focus? Start your 25m session with Fumi & friends"}
                </p>

                {/* Interactive Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    className="hover-lift-sm inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FF729F] hover:bg-[#F25577] dark:hover:bg-[#FF5D8F] text-white text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-4 h-4" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" /> Start Timer
                      </>
                    )}
                  </button>

                  <button
                    onClick={resetTimer}
                    className="hover-lift-sm p-2.5 rounded-full bg-white dark:bg-[#302641] hover:bg-[#FAF6F2] dark:hover:bg-[#3E3154] border border-[#E9DFD8] dark:border-[#40354F] text-[#7D6E7E] dark:text-[#B9AEC9] hover:text-[#4A3E4D] dark:hover:text-[#F8F1FF] shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                    title="Reset to 25:00"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Room Friends Live Presence Strip */}
              <div className="pt-4 border-t border-[#F2E4EC] dark:border-[#40354F] flex flex-col gap-2">
                <div className="text-[11px] font-bold text-[#8C7B8E] dark:text-[#B9AEC9] flex items-center justify-between">
                  <span>Study Buddies in Room (3)</span>
                  <span className="text-[#2EB562] dark:text-[#91E6C1] font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#2EB562] dark:bg-[#91E6C1] animate-ping" />
                    Live Sync
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-left">
                  {/* Buddy 1: Bestie */}
                  <div className="hover-lift-sm bg-white/90 dark:bg-[#302641] p-2.5 rounded-2xl border border-[#F3E2EA] dark:border-[#40354F] hover:border-[#FF729F]/60 dark:hover:border-[#FF729F]/60 hover:shadow-md hover:shadow-pink-500/10 dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.5),0_0_12px_rgba(255,114,159,0.2)] flex items-center gap-2 cursor-pointer group select-none">
                    <span className="text-base group-hover:scale-125 group-hover:rotate-6 transition-transform duration-300">🌸</span>
                    <div className="overflow-hidden">
                      <div className="text-[11px] font-extrabold text-[#4A3E4D] dark:text-[#F8F1FF] truncate group-hover:text-[#FF729F] transition-colors">
                        Bestie
                      </div>
                      <div className="text-[9px] text-[#FF729F] font-bold">
                        42m focused
                      </div>
                    </div>
                  </div>

                  {/* Buddy 2: Aarav */}
                  <div className="hover-lift-sm bg-white/90 dark:bg-[#302641] p-2.5 rounded-2xl border border-[#E7EFF9] dark:border-[#40354F] hover:border-[#F6D28B]/60 dark:hover:border-[#F6D28B]/60 hover:shadow-md hover:shadow-amber-500/10 dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.5),0_0_12px_rgba(246,210,139,0.2)] flex items-center gap-2 cursor-pointer group select-none">
                    <span className="text-base group-hover:scale-125 group-hover:-rotate-6 transition-transform duration-300">🍵</span>
                    <div className="overflow-hidden">
                      <div className="text-[11px] font-extrabold text-[#4A3E4D] dark:text-[#F8F1FF] truncate group-hover:text-[#D99B16] dark:group-hover:text-[#F6D28B] transition-colors">
                        Aarav
                      </div>
                      <div className="text-[9px] text-[#D99B16] dark:text-[#F6D28B] font-bold">
                        On Break
                      </div>
                    </div>
                  </div>

                  {/* Buddy 3: Tara */}
                  <div className="hover-lift-sm bg-white/90 dark:bg-[#302641] p-2.5 rounded-2xl border border-[#EAF7EE] dark:border-[#40354F] hover:border-[#91E6C1]/60 dark:hover:border-[#91E6C1]/60 hover:shadow-md hover:shadow-emerald-500/10 dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.5),0_0_12px_rgba(145,230,193,0.2)] flex items-center gap-2 cursor-pointer group select-none">
                    <span className="text-base group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300">✨</span>
                    <div className="overflow-hidden">
                      <div className="text-[11px] font-extrabold text-[#4A3E4D] dark:text-[#F8F1FF] truncate group-hover:text-[#2EB562] dark:group-hover:text-[#91E6C1] transition-colors">
                        Tara
                      </div>
                      <div className="text-[9px] text-[#2EB562] dark:text-[#91E6C1] font-bold">
                        1h 10m
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Pill Tag 1 (Top Right) */}
              <div className="hover-lift-pill absolute -top-3.5 right-6 bg-white dark:bg-[#302641] shadow-md hover:shadow-lg border border-[#F5E2EC] dark:border-[#40354F] hover:border-[#FF729F]/60 dark:hover:border-[#FF729F]/60 px-3.5 py-1 rounded-full flex items-center gap-1.5 select-none cursor-pointer group">
                <span className="text-[11px] font-bold text-[#514453] dark:text-[#F8F1FF]">
                  Same Space Brighter Days
                </span>
                <Heart className="w-3 h-3 text-[#FF729F] fill-[#FF729F] group-hover:scale-125 transition-transform duration-300" />
              </div>

              {/* Floating Pill Tag 2 (Bottom Left) */}
              <div className="hover-lift-pill absolute -bottom-3.5 left-6 bg-white dark:bg-[#302641] shadow-md hover:shadow-lg border border-[#F5E2EC] dark:border-[#40354F] hover:border-[#FF729F]/60 dark:hover:border-[#FF729F]/60 px-3.5 py-1 rounded-full flex items-center gap-1.5 select-none cursor-pointer group">
                <span className="text-[11px] font-bold text-[#514453] dark:text-[#F8F1FF]">
                  Study Grow Together
                </span>
                <Heart className="w-3 h-3 text-[#FF729F] fill-[#FF729F] group-hover:scale-125 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
