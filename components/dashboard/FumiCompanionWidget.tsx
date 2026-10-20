"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Heart,
  Shield,
  Check,
  Lock,
  RotateCw,
  Info,
} from "lucide-react";
import {
  getCompanionProfile,
  equipCosmetic,
  type CompanionResult,
} from "@/app/actions/companion";
import {
  COSMETICS_CATALOG,
  getCompanionQuote,
  type CosmeticMetadata,
} from "@/lib/progression/companion";
import type {
  CompanionCosmetic,
  CompanionProfile,
} from "@/types/database";

interface FumiCompanionWidgetProps {
  initialCompanion?: CompanionResult | null;
  activeSessionState?: "idle" | "studying" | "sleeping" | "celebrating";
  previewMode?: boolean;
}

export function FumiCompanionWidget({
  initialCompanion = null,
  activeSessionState = "idle",
  previewMode = false,
}: FumiCompanionWidgetProps) {
  const [companion, setCompanion] = useState<CompanionResult | null>(initialCompanion);
  const [loading, setLoading] = useState<boolean>(previewMode ? false : !initialCompanion);
  const [equipping, setEquipping] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadProfile = async () => {
    if (previewMode) return;
    setLoading(true);
    try {
      const res = await getCompanionProfile();
      if (res.success) {
        setCompanion(res);
      }
    } catch {
      // Ignore background errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (previewMode) return;
    loadProfile();
  }, [previewMode]);

  const handleEquip = async (cosmetic: CosmeticMetadata) => {
    const isUnlocked =
      companion?.unlockedList?.includes(cosmetic.id) ||
      (companion?.progression?.level ?? 1) >= cosmetic.minLevel;

    if (!isUnlocked) return;

    setEquipping(cosmetic.id);
    try {
      if (!previewMode) {
        const res = await equipCosmetic(cosmetic.id);
        if (res.success) {
          setCompanion(res);
          setFeedback(`✨ Equipped ${cosmetic.name}!`);
          setTimeout(() => setFeedback(null), 3000);
        }
      } else {
        // Preview mode local state change
        if (companion && companion.profile) {
          setCompanion({
            ...companion,
            profile: {
              ...companion.profile,
              equipped_cosmetic: cosmetic.id,
            },
          });
          setFeedback(`✨ Equipped ${cosmetic.name}!`);
          setTimeout(() => setFeedback(null), 3000);
        }
      }
    } finally {
      setEquipping(null);
    }
  };

  const progression = companion?.progression;
  const profile = companion?.profile;
  const equipped = profile?.equipped_cosmetic || "default";

  // Map equipped cosmetic or session state to mascot asset
  const getMascotSrc = () => {
    if (activeSessionState === "studying") return "/images/mascot/fumi-studying.webp?v=2";
    if (activeSessionState === "sleeping") return "/images/mascot/fumi-sleeping.webp?v=2";
    if (activeSessionState === "celebrating") return "/images/mascot/fumi-celebrating.webp?v=2";
    if (equipped === "headphones") return "/images/mascot/fumi-headphones.webp?v=2";
    if (equipped === "royal_crown") return "/images/mascot/fumi-celebrating.webp?v=2";
    return "/images/mascot/fumi-idle.webp?v=2";
  };

  const quote = getCompanionQuote(activeSessionState);

  return (
    <div className="rounded-3xl bg-white dark:bg-[#241D33] border border-[#F0E4DE] dark:border-[#40354F] shadow-xl dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)] p-6 sm:p-7 transition-colors relative overflow-hidden">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#C5A7FF]/60 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#F0E4DE] dark:border-[#352B46]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#F4EDFF] dark:bg-[#34284A] text-[#C5A7FF]">
            <Heart className="w-5 h-5 text-[#C5A7FF]" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-[#4A3E4D] dark:text-[#F8F1FF] flex items-center gap-2">
              <span>Study Companion</span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#FFEBF0] dark:bg-[#302641] text-[#FF729F] border border-[#FF729F]/30">
                {progression?.stageInfo.emoji ?? "🌱"} Level {progression?.level ?? 1}
              </span>
            </h3>
            <p className="text-[11px] text-[#786C7B] dark:text-[#B9AEC9]">
              {progression?.stageInfo.name ?? "Sprout Fumi"} &bull; Evolves with verified focus
            </p>
          </div>
        </div>

        <button
          onClick={loadProfile}
          disabled={loading}
          className="p-2 rounded-xl text-[#A49AAB] hover:text-[#FF729F] transition-all cursor-pointer"
          title="Refresh Companion"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 p-2.5 rounded-xl bg-[#EAF5EE] dark:bg-[#182B24] border border-[#A5D6A7] dark:border-[#234A38] text-xs font-bold text-[#2E7D4E] dark:text-[#91E6C1] flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#91E6C1]" />
            <span>{feedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Companion Hero Display & Progress */}
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-[#FAF7FC] dark:bg-[#1D1729] border border-[#F0E4DE] dark:border-[#352B46]">
        {/* Animated Mascot Frame */}
        <div className="relative w-28 h-28 shrink-0">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FF729F]/20 via-[#C5A7FF]/20 to-[#91E6C1]/20 blur-xl animate-pulse" />
          <Image
            src={getMascotSrc()}
            alt="Fumi Companion"
            fill
            unoptimized
            className="object-contain relative z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)]"
          />
        </div>

        {/* Level Stats & Progress Bar */}
        <div className="flex-1 w-full space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#4A3E4D] dark:text-[#F8F1FF]">
              Stage: <strong className="text-[#C5A7FF]">{progression?.stageInfo.name ?? "Sprout Fumi"}</strong>
            </span>
            <span className="text-[11px] font-mono text-[#786C7B] dark:text-[#B9AEC9]">
              {progression?.currentLevelXp ?? 0} / {progression?.nextLevelXp ?? 300} XP
            </span>
          </div>

          {/* Progress Track */}
          <div className="w-full h-3 rounded-full bg-[#EAE2F2] dark:bg-[#302641] overflow-hidden p-0.5 border border-[#E0D5EB] dark:border-[#40354F]">
            <motion.div
              initial={false}
              animate={{ width: `${progression?.progressPercent ?? 20}%` }}
              className="h-full rounded-full bg-gradient-to-r from-[#FF729F] via-[#C5A7FF] to-[#91E6C1] shadow-xs"
            />
          </div>

          {/* Gentle, supportive cheering quote */}
          <p className="text-xs italic text-[#786C7B] dark:text-[#B9AEC9] leading-relaxed pt-1">
            &ldquo;{quote}&rdquo;
          </p>
        </div>
      </div>

      {/* Wardrobe / Unlocked Cosmetics */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-[#4A3E4D] dark:text-[#F8F1FF] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#F6D28B]" />
            <span>Cosmetics Wardrobe</span>
          </h4>
          <span className="text-[10px] text-[#A49AAB]">Click item to equip</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {COSMETICS_CATALOG.map((cosmetic) => {
            const isUnlocked =
              companion?.unlockedList?.includes(cosmetic.id) ||
              (progression?.level ?? 1) >= cosmetic.minLevel;
            const isEquipped = equipped === cosmetic.id;

            return (
              <button
                key={cosmetic.id}
                onClick={() => handleEquip(cosmetic)}
                disabled={!isUnlocked || equipping === cosmetic.id}
                className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  isEquipped
                    ? "bg-[#FF729F]/15 border-[#FF729F] ring-2 ring-[#FF729F]/40 shadow-sm"
                    : isUnlocked
                    ? "bg-white dark:bg-[#1D1729] border-[#F0E4DE] dark:border-[#352B46] hover:border-[#C5A7FF]"
                    : "bg-[#F7F4FA] dark:bg-[#171321]/60 border-dashed border-[#DCD1E6] dark:border-[#352B46] opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-2xl select-none">{cosmetic.emoji}</span>
                  {isEquipped ? (
                    <span className="p-1 rounded-full bg-[#FF729F] text-white">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  ) : !isUnlocked ? (
                    <span className="p-1 rounded-full bg-[#EAE2F2] dark:bg-[#302641] text-[#A49AAB]">
                      <Lock className="w-2.5 h-2.5" />
                    </span>
                  ) : null}
                </div>

                <div className="mt-2">
                  <p className="text-[11px] font-black text-[#4A3E4D] dark:text-[#F8F1FF] truncate">
                    {cosmetic.name}
                  </p>
                  <p className="text-[9px] text-[#786C7B] dark:text-[#B9AEC9] truncate">
                    {isUnlocked ? "Unlocked" : `Unlocks at Lvl ${cosmetic.minLevel}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fairness Notice (FR-09 Requirement) */}
      <div className="mt-5 p-3 rounded-2xl bg-[#FFFDF9] dark:bg-[#1D1729] border border-[#F0E4DE] dark:border-[#352B46] flex items-center gap-2 text-[11px] text-[#786C7B] dark:text-[#B9AEC9]">
        <Shield className="w-4 h-4 text-[#91E6C1] shrink-0" />
        <span>
          <strong>Fair Play Guarantee:</strong> Cosmetics are purely decorative tokens of study devotion and do not affect leaderboard rankings.
        </span>
      </div>
    </div>
  );
}

