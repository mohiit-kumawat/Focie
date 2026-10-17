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
  const avatarUrl = profile?.avatar_url || "/images/mascot/fumi-idle.webp";
  const dayStartTime = settings?.day_start_time?.slice(0, 5) || "06:00";
  const timezone = settings?.timezone || profile?.timezone || "Asia/Kolkata";

  return (
    <div className="min-h-screen bg-[#FFFDF9] dark:bg-[#1D1726] text-[#4A3E4D] dark:text-[#F8F1FF] flex flex-col transition-colors duration-300">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-[#E9DFD8]/80 dark:border-[#40354F]/80 bg-white/70 dark:bg-[#241D33]/70 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <FocusieLogo size={32} />

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div className="h-5 w-px bg-[#E9DFD8] dark:bg-[#40354F]" />

          {/* User mini profile */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-8 h-8 rounded-full border border-[#FF729F]/40 overflow-hidden relative bg-[#FFEBF0]">
              <Image
                src={avatarUrl}
                alt={displayName}
                fill
                sizes="32px"
                className="object-contain"
              />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold leading-tight">{displayName}</p>
              <p className="text-[10px] text-[#786C7B] dark:text-[#C5BAD3]">@{username}</p>
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
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Welcome Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FFEBF0] via-[#F6F0FD] to-[#EAF5EE] dark:from-[#3D1E30] dark:via-[#2F2144] dark:to-[#173024] p-8 border border-[#FFD5DF]/60 dark:border-[#523363]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-black/30 text-xs font-bold text-[#FF729F] border border-[#FF729F]/30 shadow-xs">
                <Sparkles className="w-3 h-3" />
                Phase 1 Authenticated
              </span>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#4A3E4D] dark:text-[#F8F1FF]">
                Welcome home, {displayName}! 🌸
              </h1>
              <p className="text-sm md:text-base text-[#786C7B] dark:text-[#C5BAD3] max-w-lg">
                Your cozy sanctuary is all set up with Row Level Security. Fumi is ready to study by your side!
              </p>
              <div className="pt-2">
                <a
                  href="/onboarding"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FF729F] hover:bg-[#F25577] text-white text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-98"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Customize Profile & Mascot</span>
                </a>
              </div>
            </div>

            <div className="shrink-0 drop-shadow-md">
              <FumiMascot state="celebrating" size={130} />
            </div>
          </div>
        </div>

        {/* User Configuration & Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Study Day Settings Card */}
          <Card variant="cream" className="flex flex-col justify-between">
            <div className="space-y-2">
              <div className="p-2.5 rounded-2xl bg-[#FFEBF0] dark:bg-[#4A263D] w-fit text-[#FF729F]">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#4A3E4D] dark:text-[#F8F1FF]">
                24-Hour Study Day
              </h3>
              <p className="text-xs text-[#786C7B] dark:text-[#C5BAD3]">
                Your day resets daily at:
              </p>
              <p className="text-2xl font-black text-[#FF729F] tracking-tight">
                {dayStartTime} AM
              </p>
              <p className="text-[11px] text-[#A49AAB]">
                Late-night study sessions before this time count toward the previous day!
              </p>
            </div>
          </Card>

          {/* Timezone Card */}
          <Card variant="cream" className="flex flex-col justify-between">
            <div className="space-y-2">
              <div className="p-2.5 rounded-2xl bg-[#E7E0FA] dark:bg-[#302641] w-fit text-[#8B6ED6]">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#4A3E4D] dark:text-[#F8F1FF]">
                Study Timezone
              </h3>
              <p className="text-xs text-[#786C7B] dark:text-[#C5BAD3]">
                Current registered zone:
              </p>
              <p className="text-lg font-bold text-[#4A3E4D] dark:text-[#F8F1FF]">
                {timezone}
              </p>
              <p className="text-[11px] text-[#A49AAB]">
                Synchronized with all study group events and leaderboards.
              </p>
            </div>
          </Card>

          {/* RLS Security Status Card */}
          <Card variant="cream" className="flex flex-col justify-between">
            <div className="space-y-2">
              <div className="p-2.5 rounded-2xl bg-[#DDEFE2] dark:bg-[#1A3826] w-fit text-[#2C5E3F] dark:text-[#91E6C1]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#4A3E4D] dark:text-[#F8F1FF]">
                Cloud Security
              </h3>
              <p className="text-xs text-[#786C7B] dark:text-[#C5BAD3]">
                Row Level Security (RLS):
              </p>
              <span className="inline-block px-2.5 py-1 rounded-xl bg-[#DDEFE2] dark:bg-[#1A3826] text-xs font-semibold text-[#2C5E3F] dark:text-[#91E6C1]">
                Protected & Active
              </span>
              <p className="text-[11px] text-[#A49AAB]">
                Only you have read/write access to your private profile & study data.
              </p>
            </div>
          </Card>
        </div>

        {/* Phase Roadmap Note */}
        <Card variant="lavender" className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 relative shrink-0">
              <Image
                src="/images/mascot/fumi-studying.webp"
                alt="Fumi studying"
                fill
                sizes="48px"
                className="object-contain"
              />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#4A3E4D] dark:text-[#F8F1FF] mb-1">
                Coming in Phase 2: Live Study Rooms & Friends!
              </h4>
              <p className="text-xs text-[#786C7B] dark:text-[#C5BAD3] leading-relaxed">
                Authentication and your 24-hour study day baseline are now live! In the upcoming phase, we will add real-time study rooms, friend requests, and live presence indicator dots so you can study alongside your friends.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
