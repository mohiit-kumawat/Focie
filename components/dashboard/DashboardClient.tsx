"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FocusieLogo } from "@/components/ui/FocusieLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FumiMascot } from "@/components/ui/FumiMascot";
import { StudyTimerWidget } from "@/components/dashboard/StudyTimerWidget";
import { FriendsPresenceWidget } from "@/components/dashboard/FriendsPresenceWidget";
import { LogOut, Clock, Globe, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import type { Profile, StudyDaySettings } from "@/types/database";

interface DashboardClientProps {
  email: string;
  profile: Profile | null;
  settings: StudyDaySettings | null;
}

export function DashboardClient({ email, profile, settings }: DashboardClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const displayName = profile?.display_name || "Cozy Student";
  const username = profile?.username || email.split("@")[0];
  const avatarUrl = profile?.avatar_url || "/images/mascot/fumi-idle.webp?v=2";
  const dayStartTime = settings?.day_start_time?.slice(0, 5) || "06:00";
  const timezone = settings?.timezone || profile?.timezone || "Asia/Kolkata";

  return (
    <div className="min-h-screen bg-[#FFFDF9] dark:bg-[#171321] text-[#4A3E4D] dark:text-[#F8F1FF] flex flex-col transition-colors duration-300 relative overflow-x-hidden">
      {/* Subtle Ambient Radial Lighting for Midnight Kawaii Depth (Dark Mode Only) */}
      <div className="pointer-events-none absolute -top-24 right-1/4 w-[600px] h-[450px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,114,159,0.06)_0%,rgba(197,167,255,0.035)_45%,transparent_75%)] blur-[96px] dark:block hidden" />
      <div className="pointer-events-none absolute top-[360px] -left-24 w-[650px] h-[550px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(197,167,255,0.05)_0%,rgba(255,114,159,0.025)_40%,transparent_75%)] blur-[110px] dark:block hidden" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-[#E9DFD8]/80 dark:border-[#40354F]/80 bg-white/70 dark:bg-[#241D33]/85 backdrop-blur-md px-6 lg:px-10 py-3.5 flex items-center justify-between">
        <div className="max-w-[1360px] mx-auto w-full flex items-center justify-between">
          <FocusieLogo size={32} />

          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />

            <div className="h-5 w-px bg-[#E9DFD8] dark:bg-[#40354F]" />

            {/* User mini profile */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-8 h-8 rounded-full border border-[#FF729F]/40 overflow-hidden relative bg-[#FFEBF0] dark:bg-[#302641]">
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  fill
                  unoptimized
                  sizes="32px"
                  className="object-contain"
                />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold leading-tight">{displayName}</p>
                <p className="text-[10px] text-[#786C7B] dark:text-[#B9AEC9]">@{username}</p>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 text-xs text-[#A49AAB] hover:text-[#A63A50] dark:hover:text-[#FFAAB9] rounded-xl ml-1"
            >
              {loggingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area - Generous Spacious Container */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10 space-y-8 lg:space-y-10 relative z-10">
        {/* Welcome Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FFEBF0] via-[#F6F0FD] to-[#EAF5EE] dark:from-[#241D33] dark:via-[#2B213A] dark:to-[#241D33] p-7 sm:p-9 border border-[#FFD5DF]/60 dark:border-[#40354F] shadow-lg dark:shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
          {/* Subtle Pink-Lavender Ambient Illumination inside Hero Card */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(255,114,159,0.12)_0%,rgba(197,167,255,0.08)_50%,transparent_75%)] blur-2xl dark:block hidden" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-[#302641] text-xs font-bold text-[#FF729F] border border-[#FF729F]/30 shadow-xs">
                <Sparkles className="w-3 h-3" />
                Phase 2 Live · Cozy Study Sync ✨
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-4xl font-black tracking-tight text-[#4A3E4D] dark:text-[#F8F1FF]">
                Welcome home, {displayName}! 🌸
              </h1>
              <p className="text-sm md:text-base text-[#786C7B] dark:text-[#B9AEC9] max-w-xl leading-relaxed">
                Your cozy study desk is open. Start a focus session below, and Fumi will keep you company!
              </p>
              <div className="pt-2">
                <a
                  href="/onboarding"
                  className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FF729F] hover:bg-[#F25577] text-white text-xs font-bold shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-150"
                >
                  <Sparkles className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110" />
                  <span>Customize Profile & Mascot</span>
                </a>
              </div>
            </div>

            <div className="shrink-0">
              <FumiMascot state="celebrating" size={110} />
            </div>
          </div>
        </div>

        {/* Live Study Desk & Friends Presence Room */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Focus Desk (7 cols) */}
          <section className="lg:col-span-7 w-full">
            <StudyTimerWidget />
          </section>

          {/* Real-time Study Buddies Presence Room (5 cols) */}
          <aside className="lg:col-span-5 w-full">
            <FriendsPresenceWidget />
          </aside>
        </div>

        {/* User Configuration & Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Study Day Settings Card */}
          <Card variant="cream" className="flex flex-col justify-between hover:-translate-y-1 hover:border-[#FF729F]/40 transition-all duration-200">
            <div className="space-y-2">
              <div className="p-2.5 rounded-2xl bg-[#FFEBF0] dark:bg-[#302641] w-fit text-[#FF729F] border border-transparent dark:border-[#40354F]/60">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#4A3E4D] dark:text-[#F8F1FF]">
                24-Hour Study Day
              </h3>
              <p className="text-xs text-[#786C7B] dark:text-[#B9AEC9]">
                Your day resets daily at:
              </p>
              <p className="text-2xl font-black text-[#FF729F] tracking-tight">
                {dayStartTime} AM
              </p>
              <p className="text-[11px] text-[#A49AAB] dark:text-[#8C7B8E]">
                Late-night study sessions before this time count toward the previous day!
              </p>
            </div>
          </Card>

          {/* Timezone Card */}
          <Card variant="cream" className="flex flex-col justify-between hover:-translate-y-1 hover:border-[#C5A7FF]/40 transition-all duration-200">
            <div className="space-y-2">
              <div className="p-2.5 rounded-2xl bg-[#E7E0FA] dark:bg-[#302641] w-fit text-[#8B6ED6] dark:text-[#C5A7FF] border border-transparent dark:border-[#40354F]/60">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#4A3E4D] dark:text-[#F8F1FF]">
                Study Timezone
              </h3>
              <p className="text-xs text-[#786C7B] dark:text-[#B9AEC9]">
                Current registered zone:
              </p>
              <p className="text-lg font-bold text-[#4A3E4D] dark:text-[#C5A7FF]">
                {timezone}
              </p>
              <p className="text-[11px] text-[#A49AAB] dark:text-[#8C7B8E]">
                Synchronized with all study group events and leaderboards.
              </p>
            </div>
          </Card>

          {/* RLS Security Status Card */}
          <Card variant="cream" className="flex flex-col justify-between hover:-translate-y-1 hover:border-[#91E6C1]/40 transition-all duration-200">
            <div className="space-y-2">
              <div className="p-2.5 rounded-2xl bg-[#DDEFE2] dark:bg-[#302641] w-fit text-[#2C5E3F] dark:text-[#91E6C1] border border-transparent dark:border-[#40354F]/60">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#4A3E4D] dark:text-[#F8F1FF]">
                Cloud Security
              </h3>
              <p className="text-xs text-[#786C7B] dark:text-[#B9AEC9]">
                Row Level Security (RLS):
              </p>
              <span className="inline-block px-2.5 py-1 rounded-xl bg-[#DDEFE2] dark:bg-[#1A3826] text-xs font-semibold text-[#2C5E3F] dark:text-[#91E6C1] border border-transparent dark:border-[#2C5E3F]/40">
                Protected & Active
              </span>
              <p className="text-[11px] text-[#A49AAB] dark:text-[#8C7B8E]">
                Only you and your accepted buddies have authorized access.
              </p>
            </div>
          </Card>
        </div>

        {/* Phase Milestone Note */}
        <Card variant="lavender" className="p-6 border border-[#E7E0FA] dark:border-[#40354F] dark:bg-[#241D33] shadow-md dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:border-[#C5A7FF]/40 transition-all duration-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 relative shrink-0">
              <Image
                src="/images/mascot/fumi-studying.webp?v=2"
                alt="Fumi studying"
                fill
                unoptimized
                sizes="48px"
                className="object-contain"
              />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#4A3E4D] dark:text-[#F8F1FF] mb-1">
                Phase 2 Live: Cozy Study Sync & Real-Time Friends! 🌸
              </h4>
              <p className="text-xs text-[#786C7B] dark:text-[#B9AEC9] leading-relaxed">
                Your live study desk and real-time buddy room are active! You can now start Pomodoro or Flow sessions, invite study partners, and see each other focusing live over Supabase Realtime WebSockets.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
