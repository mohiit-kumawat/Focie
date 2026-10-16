"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { FumiMascot } from "@/components/ui/FumiMascot";

export const CtaBannerSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 bg-gradient-to-b from-[#FFFDF9] to-[#F7EFF5] dark:from-[#171321] dark:to-[#1D1729] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        {/* Crisp Panoramic Banner Container */}
        <div className="relative w-full rounded-3xl overflow-hidden shadow-xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] border-2 border-white dark:border-[#40354F] bg-gradient-to-r from-[#FFEBF2] via-[#FFF6EB] to-[#EAEFFD] dark:from-[#241D33] dark:via-[#1D1729] dark:to-[#302641] p-8 sm:p-14 min-h-[340px] flex items-center justify-between transition-colors">
          {/* Subtle Ambient SVG Meadow Hills in background */}
          <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 1000 350"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M0 260C200 230 400 310 600 250C800 200 900 280 1000 260V350H0V260Z"
                className="fill-[#F3E5D4] dark:fill-[#302641]"
              />
              <path
                d="M0 290C250 260 500 330 750 280C880 250 950 300 1000 290V350H0V290Z"
                className="fill-[#E8DCF0] dark:fill-[#241D33]"
              />
            </svg>
          </div>

          {/* Left Decorative Signpost Card */}
          <div className="hidden lg:flex flex-col gap-2 relative z-10 select-none">
            <div className="hover-lift-sm bg-white/90 dark:bg-[#302641] backdrop-blur-md px-4 py-2 rounded-2xl border border-[#F3E0EA] dark:border-[#40354F] hover:border-[#FF729F]/50 dark:hover:border-[#C5A7FF]/50 shadow-xs hover:shadow-md flex items-center gap-2 transform -rotate-3 hover:rotate-0 transition-all cursor-pointer">
              <span className="text-base">🌸</span>
              <span className="text-xs font-extrabold text-[#514453] dark:text-[#F8F1FF]">
                Better Focus
              </span>
            </div>

            <div className="hover-lift-sm bg-white/90 dark:bg-[#302641] backdrop-blur-md px-4 py-2 rounded-2xl border border-[#F3E0EA] dark:border-[#40354F] hover:border-[#F6D28B]/50 dark:hover:border-[#F6D28B]/50 shadow-xs hover:shadow-md flex items-center gap-2 transform rotate-2 hover:rotate-0 transition-all cursor-pointer">
              <span className="text-base">🐱</span>
              <span className="text-xs font-extrabold text-[#514453] dark:text-[#F8F1FF]">
                Closer Friends
              </span>
            </div>

            <div className="hover-lift-sm bg-white/90 dark:bg-[#302641] backdrop-blur-md px-4 py-2 rounded-2xl border border-[#F3E0EA] dark:border-[#40354F] hover:border-[#91E6C1]/50 dark:hover:border-[#91E6C1]/50 shadow-xs hover:shadow-md flex items-center gap-2 transform -rotate-1 hover:rotate-0 transition-all cursor-pointer">
              <span className="text-base">💖</span>
              <span className="text-xs font-extrabold text-[#514453] dark:text-[#F8F1FF]">
                Kinder Days
              </span>
            </div>
          </div>

          {/* Center Call to Action Content */}
          <div className="relative z-10 text-center max-w-xl mx-auto flex flex-col items-center">
            <span className="hover-lift-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-[#302641] border border-[#F2E0EB] dark:border-[#40354F] text-xs font-bold text-[#FF729F] mb-3 shadow-2xs cursor-pointer select-none">
              <Sparkles className="w-3.5 h-3.5 text-[#FF729F]" />
              <span>Begin Your Study Adventure</span>
            </span>

            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-[#4A3E4D] dark:text-[#F8F1FF] leading-tight">
              Your study story starts here.
            </h2>

            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-[#6E5D70] dark:text-[#B9AEC9] max-w-md font-medium leading-relaxed">
              Join Focusie and turn your study time into something special
              — together with your friends.
            </p>

            {/* Action Buttons */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/register"
                className="hover-lift-sm inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold text-white bg-[#FF729F] hover:bg-[#F25577] dark:hover:bg-[#FF5D8F] rounded-full shadow-md hover:shadow-lg transition-all active:scale-98"
              >
                <span>Get Started for Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <button
                type="button"
                className="hover-lift-sm inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-base font-bold text-[#4A3E4D] dark:text-[#F8F1FF] bg-white dark:bg-[#241D33] hover:bg-[#FAF6F2] dark:hover:bg-[#302641] border border-[#E9DFD8] dark:border-[#40354F] rounded-full shadow-2xs hover:shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <span className="w-6 h-6 rounded-full bg-[#FFEBF0] dark:bg-[#4A263D] text-[#FF537A] dark:text-[#FF729F] flex items-center justify-center text-xs font-bold pl-0.5">
                  ▶
                </span>
                <span>Watch Demo</span>
              </button>
            </div>
          </div>

          {/* Right Mascot Companion with Soft Pedestal */}
          <div className="hidden lg:flex flex-col items-center relative z-10 select-none">
            <div className="hover-lift-sm p-2 rounded-3xl bg-white/90 dark:bg-white/95 border-2 border-white dark:border-[#FF729F]/30 shadow-md overflow-hidden cursor-pointer group">
              <FumiMascot size={150} state="celebrating" className="group-hover:scale-105 transition-transform duration-300" />
            </div>
            <span className="hover-lift-pill mt-2 text-xs font-bold text-[#FF729F] bg-white/95 dark:bg-[#302641] px-3.5 py-1 rounded-full border border-[#F4E2EC] dark:border-[#40354F] shadow-2xs cursor-pointer select-none">
              Let&apos;s go! ✨
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
