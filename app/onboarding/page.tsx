"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usernameSchema, studyDaySettingsSchema } from "@/lib/validations/auth";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { Loader2, ArrowRight, ArrowLeft, Check, Sparkles, Clock, AlertCircle } from "lucide-react";

const AVATAR_OPTIONS = [
  {
    id: "idle",
    name: "Cozy Sprout",
    src: "/images/mascot/fumi-idle.webp",
    desc: "Always smiling and positive",
  },
  {
    id: "studying",
    name: "Focus Master",
    src: "/images/mascot/fumi-studying.webp",
    desc: "Books open, deep in the zone",
  },
  {
    id: "headphones",
    name: "Lo-fi Listener",
    src: "/images/mascot/fumi-headphones.webp",
    desc: "Beats on, distractions off",
  },
  {
    id: "sleeping",
    name: "Nap Champion",
    src: "/images/mascot/fumi-sleeping.webp",
    desc: "Rests hard, studies harder",
  },
  {
    id: "celebrating",
    name: "Party Sprout",
    src: "/images/mascot/fumi-celebrating.webp",
    desc: "Here to celebrate every streak",
  },
];

const TIME_PRESETS = [
  { time: "04:00", label: "04:00 AM", sub: "Night owl special" },
  { time: "05:00", label: "05:00 AM", sub: "Dawn riser" },
  { time: "06:00", label: "06:00 AM", sub: "Recommended standard", recommended: true },
  { time: "07:00", label: "07:00 AM", sub: "Morning focus" },
  { time: "08:00", label: "08:00 AM", sub: "Traditional morning" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("/images/mascot/fumi-idle.webp");
  const [dayStartTime, setDayStartTime] = useState("06:00");
  const [customTime, setCustomTime] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  // Step 1 Validation Errors
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);

  // Load current user and auto-detected timezone
  useEffect(() => {
    async function initUser() {
      try {
        const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
        setTimezone(detectedTz);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Fetch existing profile if trigger created one
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, display_name, avatar_url")
          .eq("id", user.id)
          .single();

        if (profile) {
          if (profile.username && !profile.username.startsWith("user_")) {
            setUsername(profile.username);
          }
          if (profile.display_name) {
            setDisplayName(profile.display_name);
          }
          if (profile.avatar_url) {
            setSelectedAvatar(profile.avatar_url);
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        setInitialLoading(false);
      }
    }

    initUser();
  }, [router, supabase]);

  // Handle Step 1 Next
  const handleStep1Next = () => {
    setUsernameError(null);
    setDisplayNameError(null);

    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplay = displayName.trim();

    const usernameResult = usernameSchema.safeParse(cleanUsername);
    if (!usernameResult.success) {
      setUsernameError(usernameResult.error.issues[0]?.message ?? "Invalid username");
      return;
    }

    if (!cleanDisplay) {
      setDisplayNameError("Please choose a display name");
      return;
    }

    setUsername(cleanUsername);
    setDisplayName(cleanDisplay);
    setStep(2);
  };

  // Handle Final Submission (Step 3)
  const handleFinalSubmit = async () => {
    setErrorMsg(null);
    const finalStartTime = customTime || dayStartTime;

    const timeValidation = studyDaySettingsSchema.safeParse({
      timezone,
      day_start_time: finalStartTime,
    });

    if (!timeValidation.success) {
      setErrorMsg("Please select a valid 24-hour time (HH:MM format).");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 1. Update Profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username: username.toLowerCase().trim(),
          display_name: displayName.trim(),
          avatar_url: selectedAvatar,
          timezone,
        })
        .eq("id", user.id);

      if (profileError) {
        if (profileError.code === "23505") {
          setErrorMsg("This username is already taken! Please go back and pick another.");
        } else {
          setErrorMsg(profileError.message);
        }
        setLoading(false);
        return;
      }

      // 2. Upsert Study Day Settings
      const { error: settingsError } = await supabase
        .from("study_day_settings")
        .upsert(
          {
            user_id: user.id,
            timezone,
            day_start_time: `${finalStartTime}:00`,
          },
          { onConflict: "user_id" }
        );

      if (settingsError) {
        setErrorMsg(settingsError.message);
        setLoading(false);
        return;
      }

      // Success -> Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMsg("Failed to save onboarding settings. Please try again.");
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF5EE] dark:bg-[#1D1726]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF729F]" />
      </div>
    );
  }

  return (
    <AuthCard
      title={
        step === 1
          ? "Set up your Profile"
          : step === 2
          ? "Choose your Mascot"
          : "Your 24-Hour Study Day"
      }
      subtitle={
        step === 1
          ? "How should your study buddies know you?"
          : step === 2
          ? "Pick your companion vibe for study rooms!"
          : "When does your day start? Keep your streak safe!"
      }
      fumiState={step === 1 ? "idle" : step === 2 ? "headphones" : "celebrating"}
    >
      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-300 ${
              step === s
                ? "w-8 bg-[#FF729F]"
                : step > s
                ? "w-2 bg-[#91E6C1]"
                : "w-2 bg-[#E9DFD8] dark:bg-[#40354F]"
            }`}
          />
        ))}
      </div>

      {errorMsg && (
        <div className="mb-4 flex items-start gap-2.5 p-3 rounded-2xl bg-[#FFEBF0] dark:bg-[#4A263D]/60 border border-[#FFD5DF] dark:border-[#6A3756] text-[#A63A50] dark:text-[#FFAAB9] text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Username & Display Name */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-[#786C7B] dark:text-[#C5BAD3] mb-1.5"
            >
              Unique Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#A49AAB]">
                @
              </span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="cozystudent"
                className={`w-full pl-8 pr-4 py-2.5 rounded-2xl bg-[#FBF9F5] dark:bg-[#1E1829] border text-[#4A3E4D] dark:text-[#F8F1FF] placeholder-[#A49AAB] dark:placeholder-[#6C5F79] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF729F] transition-all ${
                  usernameError
                    ? "border-[#FF729F] ring-1 ring-[#FF729F]"
                    : "border-[#E9DFD8] dark:border-[#40354F]"
                }`}
              />
            </div>
            {usernameError ? (
              <p className="text-xs text-[#FF729F] mt-1 font-medium">{usernameError}</p>
            ) : (
              <p className="text-[11px] text-[#A49AAB] mt-1">
                Lowercase letters, numbers, and underscores (3-24 chars).
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="displayName"
              className="block text-xs font-semibold uppercase tracking-wider text-[#786C7B] dark:text-[#C5BAD3] mb-1.5"
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Mohit"
              className={`w-full px-4 py-2.5 rounded-2xl bg-[#FBF9F5] dark:bg-[#1E1829] border text-[#4A3E4D] dark:text-[#F8F1FF] placeholder-[#A49AAB] dark:placeholder-[#6C5F79] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF729F] transition-all ${
                displayNameError
                  ? "border-[#FF729F] ring-1 ring-[#FF729F]"
                  : "border-[#E9DFD8] dark:border-[#40354F]"
              }`}
            />
            {displayNameError && (
              <p className="text-xs text-[#FF729F] mt-1 font-medium">{displayNameError}</p>
            )}
          </div>

          <div className="pt-3">
            <Button
              type="button"
              onClick={handleStep1Next}
              variant="primary"
              size="md"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl"
            >
              <span>Continue to Mascot</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Avatar Selection */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
            {AVATAR_OPTIONS.map((avatar) => {
              const isSelected = selectedAvatar === avatar.src;
              return (
                <button
                  type="button"
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.src)}
                  className={`relative p-3 rounded-2xl text-left border transition-all flex flex-col items-center cursor-pointer ${
                    isSelected
                      ? "border-[#FF729F] bg-[#FFEBF0]/70 dark:bg-[#4A263D]/50 shadow-xs ring-2 ring-[#FF729F]/30"
                      : "border-[#E9DFD8] dark:border-[#40354F] bg-[#FBF9F5]/80 dark:bg-[#1E1829]/60 hover:border-[#FF729F]/50"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-2 right-2 p-1 rounded-full bg-[#FF729F] text-white">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                  <div className="w-16 h-16 relative mb-2">
                    <Image
                      src={avatar.src}
                      alt={avatar.name}
                      fill
                      sizes="64px"
                      className="object-contain"
                    />
                  </div>
                  <span className="text-xs font-bold text-[#4A3E4D] dark:text-[#F8F1FF] text-center">
                    {avatar.name}
                  </span>
                  <span className="text-[10px] text-[#786C7B] dark:text-[#C5BAD3] text-center line-clamp-1 mt-0.5">
                    {avatar.desc}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              onClick={() => setStep(1)}
              variant="secondary"
              size="md"
              className="w-1/3 flex items-center justify-center gap-1.5 py-3 rounded-2xl"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <Button
              type="button"
              onClick={() => setStep(3)}
              variant="primary"
              size="md"
              className="w-2/3 flex items-center justify-center gap-2 py-3 rounded-2xl"
            >
              <span>Continue to Day Time</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: 24-Hour Study Day Settings */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#FFF8E5] dark:bg-[#45361D]/40 border border-[#F9EDC7] dark:border-[#69522B] text-xs text-[#5C4927] dark:text-[#F6D28B] leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5" />
              Why this is magic for students:
            </p>
            If your study day starts at <span className="font-bold">6:00 AM</span>, studying until 2:00 AM tonight still counts toward today! Your streak is completely protected.
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#786C7B] dark:text-[#C5BAD3]">
              Choose Day Reset Time
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIME_PRESETS.map((p) => {
                const isSelected = !customTime && dayStartTime === p.time;
                return (
                  <button
                    type="button"
                    key={p.time}
                    onClick={() => {
                      setDayStartTime(p.time);
                      setCustomTime("");
                    }}
                    className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#FF729F] bg-[#FFEBF0]/70 dark:bg-[#4A263D]/50 ring-2 ring-[#FF729F]/30"
                        : "border-[#E9DFD8] dark:border-[#40354F] bg-[#FBF9F5] dark:bg-[#1E1829] hover:border-[#FF729F]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#4A3E4D] dark:text-[#F8F1FF]">
                        {p.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#FF729F]" />}
                    </div>
                    <span className="text-[10px] text-[#786C7B] dark:text-[#C5BAD3] block mt-0.5">
                      {p.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Time Option */}
            <div className="pt-1">
              <label
                htmlFor="customTime"
                className="block text-[11px] font-medium text-[#786C7B] dark:text-[#C5BAD3] mb-1"
              >
                Or enter a custom time (24h format HH:MM):
              </label>
              <input
                id="customTime"
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="w-full px-4 py-2 rounded-2xl bg-[#FBF9F5] dark:bg-[#1E1829] border border-[#E9DFD8] dark:border-[#40354F] text-xs text-[#4A3E4D] dark:text-[#F8F1FF] focus:outline-none focus:ring-2 focus:ring-[#FF729F]"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              onClick={() => setStep(2)}
              variant="secondary"
              size="md"
              disabled={loading}
              className="w-1/3 flex items-center justify-center gap-1.5 py-3 rounded-2xl"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <Button
              type="button"
              onClick={handleFinalSubmit}
              variant="primary"
              size="md"
              disabled={loading}
              className="w-2/3 flex items-center justify-center gap-2 py-3 rounded-2xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Finish Setup!</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </AuthCard>
  );
}

