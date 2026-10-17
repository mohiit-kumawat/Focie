"use client";

import React from "react";
import Link from "next/link";
import { FocusieLogo } from "@/components/ui/FocusieLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AnimatedFumiAuthCompanion } from "@/components/auth/AnimatedFumiAuthCompanion";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  fumiState?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  children,
  title,
  subtitle,
  showLogo = true,
}) => {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 bg-[#FFFDF9] dark:bg-[#0E0B14] text-[#4A3E4D] dark:text-[#F8F1FF] transition-colors duration-500 overflow-hidden">
      {/* 1. HD Cozy Anime Study Desk Wallpapers (Dual Sunny Study / Midnight Kawaii) */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Sunny Morning Background (Light Theme) */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700 opacity-80 dark:opacity-0"
          style={{
            backgroundImage: "url('/images/focie-sunny-morning-bg.webp')",
          }}
        />

        {/* Cozy Twilight / Night Background (Dark Theme) */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700 opacity-0 dark:opacity-85"
          style={{
            backgroundImage: "url('/images/focie-cozy-night-bg.webp')",
          }}
        />

        {/* Atmospheric Vignette & Soft Tint Overlays for Card Focus */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FFFDF9]/80 via-transparent to-[#FFFDF9]/50 dark:from-[#0E0B14]/90 dark:via-[#0E0B14]/35 dark:to-[#0E0B14]/75" />

        {/* Subtle Modern Dot Matrix Grid */}
        <div
          className="absolute inset-0 opacity-15 dark:opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(rgba(197, 167, 255, 0.25) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* 2. Top Header Navigation (Crisp & Minimal) */}
      <header className="absolute top-5 sm:top-7 left-6 right-6 flex items-center justify-between z-40">
        {showLogo ? (
          <Link
            href="/"
            className="flex items-center gap-2.5 group hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF729F] rounded-xl px-2 py-1"
          >
            <FocusieLogo size={32} />
            <span className="font-display font-black text-xl tracking-tight text-[#4A3E4D] dark:text-[#F8F1FF] group-hover:text-[#FF729F] transition-colors">
              Focie
            </span>
          </Link>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* 3. Center Wrapper: Mascot + Glowing Card Architecture */}
      <div className="w-full max-w-[420px] relative z-20 mt-28 sm:mt-32">
        {/* ATTRACTIVE AMBIENT GLOW AROUND RECTANGULAR DASHBOARD CARD */}
        <div
          className="absolute -inset-1 rounded-[34px] pointer-events-none select-none z-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(255, 114, 159, 0.4) 0%, rgba(197, 167, 255, 0.3) 48%, rgba(255, 114, 159, 0.3) 100%)",
            filter: "blur(22px)",
            opacity: 0.82,
          }}
        />

        {/* Secondary Deep Aura for Soft Spread */}
        <div
          className="absolute -inset-3 rounded-[38px] pointer-events-none select-none z-0"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(255, 114, 159, 0.25) 0%, rgba(197, 167, 255, 0.15) 50%, transparent 80%)",
            filter: "blur(32px)",
            opacity: 0.65,
          }}
        />

        {/* FUMI 3D ANIMATED COMPANION (Anchored physically BEHIND the dashboard card) */}
        <div className="absolute bottom-[calc(100%-48px)] sm:bottom-[calc(100%-52px)] left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
          <AnimatedFumiAuthCompanion />
        </div>

        {/* 4. The Glassmorphic Authentication Card Surface (Physically masks Fumi's body) */}
        <div className="relative z-20 pt-8 pb-7 px-6 sm:px-8 rounded-[32px] bg-white/95 dark:bg-[#1B1427] backdrop-blur-2xl border border-[#F0E4DE] dark:border-[#FF729F]/35 shadow-[0_24px_60px_-12px_rgba(255,114,159,0.22),0_12px_35px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85),0_0_35px_rgba(255,114,159,0.18)] transition-all">
          {/* Subtle Top Rim Highlight for Sleek Depth */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#FF729F]/70 to-transparent pointer-events-none" />

          {/* Card Header */}
          <div className="text-center mb-5">
            <h1 className="text-2xl sm:text-[26px] font-black tracking-tight text-[#4A3E4D] dark:text-[#F8F1FF] drop-shadow-xs">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm mt-1.5 text-[#7D6E7E] dark:text-[#B9AEC9] leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form Content */}
          {children}
        </div>
      </div>
    </div>
  );
};
