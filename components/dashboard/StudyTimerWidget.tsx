"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  Square,
  Sparkles,
  BookOpen,
  Volume2,
  VolumeX,
  Plus,
  X,
  Pencil,
  RotateCcw,
  Check,
} from "lucide-react";
import { useStudyTimer } from "@/hooks/useStudyTimer";
import { soundEngine } from "@/lib/audio/chime";
import { saveUserCustomSubjects } from "@/app/actions/session";
import { FocusAudioPlayer } from "@/components/dashboard/FocusAudioPlayer";
import type { SessionMode, StudySession } from "@/types/database";

interface StudyTimerWidgetProps {
  onSessionComplete?: (session: StudySession) => void;
  initialSubjects?: string[];
  userId?: string;
}

const DEFAULT_PRESET_SUBJECTS = [
  "Deep Work ⚡",
  "Mathematics 📐",
  "Coding 💻",
  "Reading 📖",
  "Language 🎌",
  "Science 🧬",
];

const QUICK_SUGGESTIONS = [
  "Biology 🧬",
  "Chemistry 🧪",
  "History 📜",
  "Literature 📚",
  "Design 🎨",
  "Exam Prep ✍️",
];

const STORAGE_KEY = "focie_custom_subjects_v1";

export function StudyTimerWidget({
  onSessionComplete,
  initialSubjects,
  userId,
}: StudyTimerWidgetProps) {
  const [selectedMode, setSelectedMode] = useState<SessionMode>("pomodoro");
  const [targetMinutes, setTargetMinutes] = useState<number>(25);
  const [subjects, setSubjects] = useState<string[]>(() => {
    if (initialSubjects && initialSubjects.length > 0) {
      return initialSubjects;
    }
    return DEFAULT_PRESET_SUBJECTS;
  });
  const [subjectTag, setSubjectTag] = useState<string>(() => {
    if (initialSubjects && initialSubjects.length > 0) {
      return initialSubjects[0]!;
    }
    return "Deep Work ⚡";
  });
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);
  const [showAddInput, setShowAddInput] = useState<boolean>(false);
  const [newSubjectName, setNewSubjectName] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [completedSession, setCompletedSession] = useState<StudySession | null>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number; emoji: string }[]>([]);
  const [fumiBounce, setFumiBounce] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.getMuted());

  // Load custom subjects from localStorage on mount & synchronize with server preferences
  useEffect(() => {
    const userStorageKey = userId ? `focie_custom_subjects_${userId}` : STORAGE_KEY;
    try {
      // 1. Try user-specific localStorage first
      const stored = localStorage.getItem(userStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSubjects(parsed);
          setSubjectTag((prev) => (parsed.includes(prev) ? prev : parsed[0]!));
          return;
        }
      }

      // 2. Fall back to generic localStorage key if available
      const legacy = localStorage.getItem(STORAGE_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSubjects(parsed);
          setSubjectTag((prev) => (parsed.includes(prev) ? prev : parsed[0]!));
          if (userId) {
            localStorage.setItem(userStorageKey, JSON.stringify(parsed));
            saveUserCustomSubjects(parsed).catch(() => {});
          }
          return;
        }
      }

      // 3. If initialSubjects was provided from Supabase database, seed localStorage
      if (initialSubjects && initialSubjects.length > 0) {
        setSubjects(initialSubjects);
        setSubjectTag((prev) => (initialSubjects.includes(prev) ? prev : initialSubjects[0]!));
        localStorage.setItem(userStorageKey, JSON.stringify(initialSubjects));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSubjects));
      }
    } catch {
      // Ignore storage read errors
    }
  }, [userId, initialSubjects]);

  const persistSubjects = (newList: string[]) => {
    setSubjects(newList);
    const userStorageKey = userId ? `focie_custom_subjects_${userId}` : STORAGE_KEY;
    try {
      localStorage.setItem(userStorageKey, JSON.stringify(newList));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch {
      // Ignore storage write errors
    }

    // Persist to user profile preferences in Supabase
    saveUserCustomSubjects(newList).catch((err) => {
      console.error("Failed to persist custom subjects to Supabase:", err);
    });
  };

  const handleAddSubject = (nameToAdd?: string) => {
    const raw = (nameToAdd || newSubjectName).trim();
    if (!raw) return;
    const clean = raw.slice(0, 40);

    if (!subjects.includes(clean)) {
      const updated = [...subjects, clean];
      persistSubjects(updated);
      setSubjectTag(clean);
    } else {
      setSubjectTag(clean);
    }

    setNewSubjectName("");
    setShowAddInput(false);
  };

  const handleRemoveSubject = (idx: number) => {
    if (subjects.length <= 1) return;
    const removedItem = subjects[idx];
    const updated = subjects.filter((_, i) => i !== idx);
    persistSubjects(updated);

    if (subjectTag === removedItem) {
      setSubjectTag(updated[0] || "Deep Work ⚡");
    }
    if (editingIndex === idx) {
      setEditingIndex(null);
    }
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const clean = editingValue.trim().slice(0, 40);
    if (!clean) {
      setEditingIndex(null);
      return;
    }

    const oldName = subjects[editingIndex];
    const updated = [...subjects];
    updated[editingIndex] = clean;
    persistSubjects(updated);

    if (subjectTag === oldName) {
      setSubjectTag(clean);
    }

    setEditingIndex(null);
    setEditingValue("");
  };

  const handleResetDefaults = () => {
    persistSubjects(DEFAULT_PRESET_SUBJECTS);
    setSubjectTag(DEFAULT_PRESET_SUBJECTS[0] ?? "Deep Work ⚡");
    setEditingIndex(null);
    setShowAddInput(false);
  };

  const handleToggleSound = () => {
    const next = soundEngine.toggleMuted();
    setIsMuted(next);
    if (!next) {
      soundEngine.playStartChime(0.12);
    }
  };

  const timer = useStudyTimer({
    onSessionComplete: (session) => {
      setCompletedSession(session);
      onSessionComplete?.(session);
    },
  });

  // Floating heart spawner and playful bounce on mascot click
  const handleFumiClick = () => {
    const id = Date.now();
    const x = (Math.random() - 0.5) * 44;
    const emojis = ["💖", "✨", "🌸", "⭐", "💕"];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    setHearts((prev) => [...prev, { id, x, emoji }]);
    setFumiBounce(true);
    setTimeout(() => setFumiBounce(false), 320);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1200);
  };

  // Circular progress calculations
  const radius = 108;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timer.progressFraction || 0) * circumference;

  // Mascot pose selection based on timer state
  const getMascotPose = () => {
    if (completedSession) return "/images/mascot/fumi-celebrating.webp?v=2";
    if (timer.state === "active") return "/images/mascot/fumi-headphones.webp?v=2";
    if (timer.state === "paused") return "/images/mascot/fumi-sleeping.webp?v=2";
    return "/images/mascot/fumi-idle.webp?v=2";
  };

  const getMascotSpeech = () => {
    if (completedSession) return "Woohoo! Study streak leveled up! 🎉";
    if (timer.state === "active") return "Focusing together with music! 🎧";
    if (timer.state === "paused") return "Taking a cozy breather... ☕";
    return "Ready when you are, bestie! 🌸";
  };

  return (
    <div className="relative rounded-3xl bg-white dark:bg-[#241D33] border border-[#F0E4DE] dark:border-[#40354F] shadow-xl dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)] p-6 sm:p-7 lg:p-8 transition-colors">
      {/* Ambient Top Glow */}
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#FF729F]/60 to-transparent pointer-events-none" />

      {/* Completion Modal / Celebration Overlay */}
      <AnimatePresence>
        {completedSession && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-30 rounded-3xl bg-[#1B1427]/95 dark:bg-[#151020]/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center space-y-4 text-white"
          >
            <motion.div
              animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              className="relative w-28 h-28"
            >
              <Image
                src="/images/mascot/fumi-celebrating.webp?v=2"
                alt="Fumi celebrating"
                fill
                unoptimized
                sizes="112px"
                className="object-contain drop-shadow-[0_12px_24px_rgba(255,114,159,0.3)]"
              />
            </motion.div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF729F]/20 text-xs font-black text-[#FF729F] border border-[#FF729F]/40">
                <Sparkles className="w-3.5 h-3.5" />
                Session Completed!
              </span>
              <h2 className="text-2xl font-black text-[#F8F1FF]">Amazing Focus, Bestie! ✨</h2>
              <p className="text-xs sm:text-sm text-[#B9AEC9] max-w-sm">
                You logged{" "}
                <strong className="text-[#91E6C1]">
                  {Math.round(completedSession.accumulated_seconds / 60)} minutes
                </strong>{" "}
                of deep focus on <span className="text-[#FF729F]">{completedSession.subject_tag}</span>.
              </p>
            </div>

            <button
              onClick={() => setCompletedSession(null)}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF729F] to-[#F25577] text-white text-xs font-black shadow-md hover:scale-105 transition-all cursor-pointer"
            >
              Start Next Session 🌸
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header: Mode Selector & Duration Presets */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-[#F0E4DE] dark:border-[#352B46]">
        {/* Mode Selector Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-[#FFF5F8] dark:bg-[#302641] border border-[#F0E4DE] dark:border-[#40354F]">
          <button
            disabled={timer.state !== "idle"}
            onClick={() => {
              setSelectedMode("pomodoro");
              setTargetMinutes(25);
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedMode === "pomodoro"
                ? "bg-white dark:bg-[#241D33] text-[#FF729F] shadow-xs"
                : "text-[#7D6E7E] dark:text-[#B9AEC9] hover:text-[#4A3E4D] dark:hover:text-[#F8F1FF]"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            🍅 Pomodoro
          </button>
          <button
            disabled={timer.state !== "idle"}
            onClick={() => {
              setSelectedMode("stopwatch");
              setTargetMinutes(60);
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedMode === "stopwatch"
                ? "bg-white dark:bg-[#241D33] text-[#FF729F] shadow-xs"
                : "text-[#7D6E7E] dark:text-[#B9AEC9] hover:text-[#4A3E4D] dark:hover:text-[#F8F1FF]"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            ⏱️ Flow Mode
          </button>
        </div>

        {/* Right Header: Duration Presets & Audio Toggle */}
        <div className="flex items-center gap-2.5">
          {selectedMode === "pomodoro" && timer.state === "idle" && (
            <div className="flex items-center gap-1.5">
              {[25, 45, 50, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setTargetMinutes(mins)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                    targetMinutes === mins
                      ? "bg-[#FFEBF0] dark:bg-[#FF729F]/20 text-[#FF729F] border border-[#FF729F]/50 shadow-xs scale-105"
                      : "bg-white dark:bg-[#302641] text-[#7D6E7E] dark:text-[#B9AEC9] border border-[#E9DFD8] dark:border-[#40354F] hover:border-[#FF729F]/50 hover:text-[#FF729F] hover:scale-105 active:scale-95"
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          )}

          {/* Study Focus Audio Player (Lo-Fi & Alert Beats) */}
          <FocusAudioPlayer timerState={timer.state} />

          {/* Sound Mute Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl border border-[#E9DFD8] dark:border-[#40354F] bg-white dark:bg-[#302641] hover:bg-[#FFEBF0] dark:hover:bg-[#40354F] hover:scale-110 active:scale-90 text-[#7D6E7E] dark:text-[#B9AEC9] transition-all duration-150 cursor-pointer shadow-2xs"
            title={isMuted ? "Bell chimes muted" : "Bell chimes on"}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-[#A49AAB]" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-[#FF729F]" />
            )}
          </button>
        </div>
      </div>

      {/* Main Study Desk Area (Mascot + Centerpiece Circular Timer) */}
      <div className="py-7 sm:py-9 flex flex-col md:flex-row items-center justify-around gap-8">
        {/* LEFT: Fumi Reactive Companion */}
        <div className="flex flex-col items-center space-y-3">
          {/* Floating Speech Bubble */}
          <motion.div
            key={timer.state}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative px-4 py-2 rounded-2xl bg-white dark:bg-[#302641] border border-[#FF729F]/35 shadow-md text-xs font-extrabold text-[#4A3E4D] dark:text-[#F8F1FF]"
          >
            <span>{getMascotSpeech()}</span>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white dark:bg-[#302641] border-r border-b border-[#FF729F]/35 transform rotate-45" />
          </motion.div>

          {/* Interactive Fumi Mascot Body */}
          <div
            onClick={handleFumiClick}
            className="relative w-36 h-40 sm:w-44 sm:h-48 cursor-pointer select-none group"
            title="Click Fumi to give love!"
          >
            {/* Heart & Sparkle Particle Spawner */}
            <AnimatePresence>
              {hearts.map((heart) => (
                <motion.div
                  key={heart.id}
                  initial={{ scale: 0.5, y: 0, x: heart.x, opacity: 1, rotate: (Math.random() - 0.5) * 30 }}
                  animate={{ scale: 1.3, y: -58, opacity: 0, rotate: (Math.random() - 0.5) * 60 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.15, ease: "easeOut" }}
                  className="absolute -top-3 left-1/2 pointer-events-none z-20 text-xl"
                >
                  {heart.emoji}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Subtle ambient lavender rim light */}
            <div className="absolute inset-2 rounded-full bg-[#C5A7FF]/15 blur-2xl pointer-events-none" />

            <motion.div
              animate={
                fumiBounce
                  ? { scale: [1, 1.12, 0.96, 1], y: [0, -10, 2, 0] }
                  : timer.state === "active"
                  ? { y: [0, -3, 0], scale: [1, 1.015, 1] }
                  : { y: [0, -1.8, 0] }
              }
              transition={
                fumiBounce
                  ? { duration: 0.32, ease: "easeOut" }
                  : { repeat: Infinity, duration: 4.2, ease: "easeInOut" }
              }
              className="relative w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_10px_26px_rgba(197,167,255,0.22)] group-hover:scale-105 active:scale-95 transition-transform duration-200 z-10"
            >
              <Image
                src={getMascotPose()}
                alt="Fumi Study Companion"
                fill
                priority
                unoptimized
                sizes="176px"
                className="object-contain"
              />
            </motion.div>
          </div>

          <span className="text-xs font-bold text-[#8C7B8E] dark:text-[#B9AEC9]">
            Fumi • Study Bestie ✨
          </span>
        </div>

        {/* RIGHT: Circular Centerpiece Timer Display */}
        <div className="flex flex-col items-center">
          <div className="relative w-64 h-64 sm:w-76 sm:h-76 flex items-center justify-center">
            {/* Subtle Ambient Radial Aura */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-[#FF729F]/15 via-[#C5A7FF]/10 to-transparent blur-2xl pointer-events-none" />

            {/* SVG Circular Progress Track */}
            <svg className="w-full h-full transform -rotate-90 select-none">
              {/* Background Track Circle */}
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                className="stroke-[#F0E4DE] dark:stroke-[#302641]"
                strokeWidth="11"
                fill="transparent"
              />
              {/* Active Progress Ring */}
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                stroke="url(#timerGradient)"
                strokeWidth="11"
                strokeLinecap="round"
                fill="transparent"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                  transition: "stroke-dashoffset 0.8s ease",
                }}
              />
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF729F" />
                  <stop offset="100%" stopColor="#C5A7FF" />
                </linearGradient>
              </defs>
            </svg>

            {/* Central Time and Status Typography */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-1.5 px-4">
              {/* Clear Status Badge */}
              {timer.state === "active" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#182B24] text-[#91E6C1] text-[11px] font-black border border-[#234A38] shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#91E6C1] animate-ping" />
                  🎧 Deep Focus
                </span>
              ) : timer.state === "paused" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#3D2C1B] text-[#F6D28B] text-[11px] font-black border border-[#5E4426] shadow-xs">
                  ☕ Taking a Breather
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#302641] text-[#FF729F] text-[11px] font-black border border-[#40354F] shadow-xs">
                  {selectedMode === "pomodoro" ? "🍅 Pomodoro" : "⏱️ Flow Mode"}
                </span>
              )}

              {/* Countdown Numbers with Tabular Font */}
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight font-mono tabular-nums text-[#4A3E4D] dark:text-[#F8F1FF] drop-shadow-sm select-none">
                {timer.state === "idle"
                  ? selectedMode === "pomodoro"
                    ? `${targetMinutes}:00`
                    : "00:00"
                  : timer.formattedDisplay}
              </h1>

              {/* Current Activity Label */}
              <span className="text-xs font-semibold text-[#8C7B8E] dark:text-[#B9AEC9] max-w-[170px] truncate bg-[#FFF5F8] dark:bg-[#302641]/80 px-3 py-0.5 rounded-lg border border-[#F0E4DE] dark:border-[#40354F]">
                {timer.session?.subject_tag || subjectTag}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Control Dock: Activity Selector & Action Buttons */}
      <div className="pt-5 border-t border-[#F0E4DE] dark:border-[#352B46] space-y-4">
        {/* Activity Chips Picker */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <BookOpen className="w-4 h-4 text-[#FF729F]" />
              <span className="text-xs font-extrabold text-[#4A3E4D] dark:text-[#F8F1FF]">
                {timer.state === "idle" ? "Focus Subject:" : "Current Subject:"}
              </span>
              {isCustomizing && (
                <span className="text-[10px] font-bold text-[#FF729F] bg-[#FFEBF0] dark:bg-[#FF729F]/20 px-2 py-0.5 rounded-full border border-[#FF729F]/30 animate-pulse">
                  Edit Mode
                </span>
              )}
            </div>

            {timer.state === "idle" && (
              <div className="flex items-center gap-1.5">
                {isCustomizing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#8C7B8E] hover:text-[#FF729F] hover:bg-[#FFEBF0] dark:hover:bg-[#FF729F]/20 transition-all flex items-center gap-1 cursor-pointer"
                      title="Reset to default subjects"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomizing(false);
                        setShowAddInput(false);
                        setEditingIndex(null);
                      }}
                      className="px-3 py-1 rounded-lg bg-[#FF729F] text-white text-xs font-bold hover:bg-[#F25577] transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Done</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowAddInput(true)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#FF729F] hover:bg-[#FFEBF0] dark:hover:bg-[#FF729F]/20 transition-all flex items-center gap-1 cursor-pointer"
                      title="Add a custom subject"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCustomizing(true)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#8C7B8E] dark:text-[#B9AEC9] hover:text-[#FF729F] hover:bg-[#FFEBF0] dark:hover:bg-[#FF729F]/20 transition-all flex items-center gap-1 cursor-pointer"
                      title="Customize or remove subjects"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Manage</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {timer.state === "idle" ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {subjects.map((sub, idx) => {
                  if (isCustomizing && editingIndex === idx) {
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#1D1729] border-2 border-[#FF729F] shadow-xs"
                      >
                        <input
                          type="text"
                          maxLength={40}
                          value={editingValue}
                          autoFocus
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") setEditingIndex(null);
                          }}
                          className="px-2 py-0.5 text-xs font-bold text-[#4A3E4D] dark:text-[#F8F1FF] bg-transparent focus:outline-hidden w-28 sm:w-36"
                        />
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="p-1 rounded-lg bg-[#FF729F] text-white hover:scale-105 cursor-pointer"
                          title="Save"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="p-1 rounded-lg text-[#8C7B8E] hover:text-[#FF729F] cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={sub}
                      className={`group relative flex items-center rounded-xl text-xs font-bold transition-all duration-150 ${
                        subjectTag === sub && !isCustomizing
                          ? "bg-[#FFEBF0] dark:bg-[#FF729F]/20 text-[#FF729F] border border-[#FF729F]/50 shadow-xs scale-105"
                          : "bg-[#FFF5F8] dark:bg-[#302641] text-[#7D6E7E] dark:text-[#B9AEC9] border border-[#E9DFD8] dark:border-[#40354F] hover:border-[#FF729F]/50 hover:text-[#FF729F]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (isCustomizing) {
                            setEditingIndex(idx);
                            setEditingValue(sub);
                          } else {
                            setSubjectTag(sub);
                          }
                        }}
                        className="px-3.5 py-1.5 cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{sub}</span>
                        {isCustomizing && (
                          <Pencil className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 text-[#FF729F]" />
                        )}
                      </button>

                      {isCustomizing && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSubject(idx);
                          }}
                          disabled={subjects.length <= 1}
                          className="pr-2.5 pl-0.5 py-1.5 text-[#8C7B8E] hover:text-[#FF729F] disabled:opacity-30 disabled:hover:text-[#8C7B8E] cursor-pointer transition-colors"
                          title={subjects.length <= 1 ? "At least 1 subject is required" : `Remove ${sub}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Inline Add button when in normal mode */}
                {!isCustomizing && !showAddInput && (
                  <button
                    type="button"
                    onClick={() => setShowAddInput(true)}
                    className="px-3 py-1.5 rounded-xl border border-dashed border-[#FF729F]/50 text-[#FF729F] text-xs font-bold hover:bg-[#FFEBF0] dark:hover:bg-[#FF729F]/15 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                )}
              </div>

              {/* Add Subject Input Drawer */}
              <AnimatePresence>
                {showAddInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-2xl bg-[#FFF5F8] dark:bg-[#1D1729] border border-[#FF729F]/30 space-y-2 overflow-hidden"
                  >
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAddSubject();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        maxLength={40}
                        autoFocus
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        placeholder="e.g. Biology 🧬, Anatomy 🫀, History 📜..."
                        className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#241D33] border border-[#F0E4DE] dark:border-[#40354F] text-xs font-bold text-[#4A3E4D] dark:text-[#F8F1FF] focus:outline-hidden focus:ring-2 focus:ring-[#FF729F]"
                      />
                      <button
                        type="submit"
                        disabled={!newSubjectName.trim()}
                        className="px-4 py-2 rounded-xl bg-[#FF729F] text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddInput(false);
                          setNewSubjectName("");
                        }}
                        className="p-2 text-[#8C7B8E] hover:text-[#FF729F] cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </form>

                    {/* Quick suggestion pills */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-bold text-[#8C7B8E] dark:text-[#B9AEC9]">Suggestions:</span>
                      {QUICK_SUGGESTIONS.filter((s) => !subjects.includes(s)).map((suggested) => (
                        <button
                          key={suggested}
                          type="button"
                          onClick={() => handleAddSubject(suggested)}
                          className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#241D33] hover:bg-[#FFEBF0] dark:hover:bg-[#FF729F]/20 text-[11px] font-semibold text-[#7D6E7E] dark:text-[#B9AEC9] border border-[#F0E4DE] dark:border-[#40354F] hover:border-[#FF729F]/40 hover:text-[#FF729F] transition-all cursor-pointer"
                        >
                          +{suggested}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <span className="text-xs font-bold text-[#FF729F] bg-[#FFEBF0] dark:bg-[#FF729F]/20 px-3.5 py-1.5 rounded-xl border border-[#FF729F]/40 shadow-xs inline-block w-fit">
              {timer.session?.subject_tag}
            </span>
          )}
        </div>

        {/* Action Buttons Area */}
        <div className="pt-2 flex items-center justify-center sm:justify-end gap-3">
          {timer.state === "idle" && (
            <button
              onClick={() => timer.start(selectedMode, targetMinutes, subjectTag)}
              disabled={timer.actionLoading}
              className="group relative w-full sm:w-auto px-10 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF729F] via-[#F25577] to-[#E04468] hover:from-[#FF5D8F] hover:via-[#EB4A6D] hover:to-[#D4385C] text-white font-black text-sm shadow-md shadow-[#FF729F]/30 hover:shadow-lg hover:shadow-[#FF729F]/45 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#FF729F] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#241D33] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white transition-transform duration-200 group-hover:scale-110 group-hover:translate-x-0.5" />
              <span>Start Studying</span>
            </button>
          )}

          {timer.state === "active" && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={timer.pause}
                disabled={timer.actionLoading}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-[#FFF8E5] dark:bg-[#3D2C1B] text-[#D99B16] dark:text-[#F6D28B] border border-[#D99B16]/40 font-bold text-xs hover:bg-[#FFF3D1] dark:hover:bg-[#4D3823] hover:scale-105 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F6D28B]"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>

              <button
                onClick={() => timer.stop()}
                disabled={timer.actionLoading}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-[#FFEBF0] dark:bg-[#4A263D] text-[#FF729F] border border-[#FF729F]/40 font-bold text-xs hover:bg-[#FFD5DF] dark:hover:bg-[#5C2E4B] hover:scale-105 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#FF729F]"
              >
                <Square className="w-3.5 h-3.5 fill-[#FF729F]" />
                <span>Finish Session</span>
              </button>
            </div>
          )}

          {timer.state === "paused" && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={timer.resume}
                disabled={timer.actionLoading}
                className="flex-1 sm:flex-initial px-7 py-3 rounded-2xl bg-[#EAF5EE] dark:bg-[#182B24] text-[#2E7D4E] dark:text-[#91E6C1] border border-[#2E7D4E]/40 font-bold text-xs hover:bg-[#D7EFE0] dark:hover:bg-[#203930] hover:scale-105 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#91E6C1]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume</span>
              </button>

              <button
                onClick={() => timer.stop()}
                disabled={timer.actionLoading}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-[#FFEBF0] dark:bg-[#4A263D] text-[#FF729F] border border-[#FF729F]/40 font-bold text-xs hover:bg-[#FFD5DF] dark:hover:bg-[#5C2E4B] hover:scale-105 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#FF729F]"
              >
                <Square className="w-3.5 h-3.5 fill-[#FF729F]" />
                <span>End</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
