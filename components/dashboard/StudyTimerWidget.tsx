"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, Square, Sparkles, BookOpen } from "lucide-react";
import { useStudyTimer } from "@/hooks/useStudyTimer";
import type { SessionMode, StudySession } from "@/types/database";

interface StudyTimerWidgetProps {
  onSessionComplete?: (session: StudySession) => void;
}

const PRESET_SUBJECTS = [
  "Deep Work ⚡",
  "Mathematics 📐",
  "Coding 💻",
  "Reading 📖",
  "Language 🎌",
  "Science 🧬",
];

export function StudyTimerWidget({ onSessionComplete }: StudyTimerWidgetProps) {
  const [selectedMode, setSelectedMode] = useState<SessionMode>("pomodoro");
  const [targetMinutes, setTargetMinutes] = useState<number>(25);
  const [subjectTag, setSubjectTag] = useState<string>("Deep Work ⚡");
  const [completedSession, setCompletedSession] = useState<StudySession | null>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);

  const timer = useStudyTimer({
    onSessionComplete: (session) => {
      setCompletedSession(session);
      onSessionComplete?.(session);
    },
  });

  // Floating heart spawner on mascot click
  const handleFumiClick = () => {
    const id = Date.now();
    const x = (Math.random() - 0.5) * 32;
    setHearts((prev) => [...prev, { id, x }]);
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
    if (completedSession) return "/images/mascot/fumi-celebrating-clean.webp";
    if (timer.state === "active") return "/images/mascot/fumi-headphones.webp";
    if (timer.state === "paused") return "/images/mascot/fumi-sleeping.webp";
    return "/images/mascot/fumi-white-clean.webp";
  };

  const getMascotSpeech = () => {
    if (completedSession) return "Woohoo! Study streak leveled up! 🎉";
    if (timer.state === "active") return "Focusing together with music! 🎧";
    if (timer.state === "paused") return "Taking a cozy breather... ☕";
    return "Ready when you are, bestie! 🌸";
  };

  return (
    <div className="relative rounded-3xl bg-white/90 dark:bg-[#241D33]/90 border border-[#F0E4DE] dark:border-[#40354F] shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl p-6 sm:p-8 transition-colors">
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
                src="/images/mascot/fumi-celebrating-clean.webp"
                alt="Fumi celebrating"
                fill
                sizes="112px"
                className="object-contain drop-shadow-lg"
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
        <div className="flex items-center p-1 rounded-2xl bg-[#FFF5F8] dark:bg-[#1D1729] border border-[#F0E4DE] dark:border-[#40354F]">
          <button
            disabled={timer.state !== "idle"}
            onClick={() => {
              setSelectedMode("pomodoro");
              setTargetMinutes(25);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedMode === "pomodoro"
                ? "bg-white dark:bg-[#2E243E] text-[#FF729F] shadow-xs"
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedMode === "stopwatch"
                ? "bg-white dark:bg-[#2E243E] text-[#FF729F] shadow-xs"
                : "text-[#7D6E7E] dark:text-[#B9AEC9] hover:text-[#4A3E4D] dark:hover:text-[#F8F1FF]"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            ⏱️ Flow Mode
          </button>
        </div>

        {/* Pomodoro Presets (25m / 50m) */}
        {selectedMode === "pomodoro" && timer.state === "idle" && (
          <div className="flex items-center gap-2">
            {[25, 45, 50, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => setTargetMinutes(mins)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  targetMinutes === mins
                    ? "bg-[#FFEBF0] dark:bg-[#4A263D] text-[#FF729F] border border-[#FF729F]/40"
                    : "bg-white dark:bg-[#1D1729] text-[#7D6E7E] dark:text-[#B9AEC9] border border-[#E9DFD8] dark:border-[#40354F]"
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Study Desk Area (Mascot + Circular Timer) */}
      <div className="py-6 sm:py-8 flex flex-col md:flex-row items-center justify-around gap-8">
        {/* LEFT: Fumi Reactive Companion */}
        <div className="flex flex-col items-center space-y-3">
          {/* Floating Speech Bubble */}
          <motion.div
            key={timer.state}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative px-3.5 py-1.5 rounded-2xl bg-white dark:bg-[#1D1729] border border-[#FF729F]/35 shadow-md text-xs font-black text-[#4A3E4D] dark:text-[#F8F1FF]"
          >
            <span>{getMascotSpeech()}</span>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white dark:bg-[#1D1729] border-r border-b border-[#FF729F]/35 transform rotate-45" />
          </motion.div>

          {/* Interactive Fumi Mascot Body */}
          <div
            onClick={handleFumiClick}
            className="relative w-36 h-40 sm:w-44 sm:h-48 cursor-pointer select-none group"
            title="Click Fumi to give love!"
          >
            {/* Heart Particle Spawner */}
            <AnimatePresence>
              {hearts.map((heart) => (
                <motion.div
                  key={heart.id}
                  initial={{ scale: 0.6, y: 0, x: heart.x, opacity: 1 }}
                  animate={{ scale: 1.25, y: -50, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                  className="absolute -top-3 left-1/2 pointer-events-none z-20 text-lg"
                >
                  💖
                </motion.div>
              ))}
            </AnimatePresence>

            <motion.div
              animate={
                timer.state === "active"
                  ? { y: [0, -3, 0], scale: [1, 1.015, 1] }
                  : { y: [0, -1.8, 0] }
              }
              transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}
              className="relative w-full h-full drop-shadow-md group-hover:scale-105 transition-transform duration-300"
            >
              <Image
                src={getMascotPose()}
                alt="Fumi Study Companion"
                fill
                priority
                sizes="176px"
                className="object-contain"
              />
            </motion.div>
          </div>

          <span className="text-[11px] font-bold text-[#8C7B8E] dark:text-[#B9AEC9]">
            Fumi • Study Bestie ✨
          </span>
        </div>

        {/* RIGHT: Circular Glowing Timer Display */}
        <div className="flex flex-col items-center">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            {/* Ambient Background Aura */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#FF729F]/15 via-[#C5A7FF]/10 to-transparent blur-xl pointer-events-none" />

            {/* SVG Circular Progress Track */}
            <svg className="w-full h-full transform -rotate-90 select-none">
              {/* Background Track Circle */}
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                className="stroke-[#F0E4DE] dark:stroke-[#352B46]"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Active Progress Ring */}
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                stroke="url(#timerGradient)"
                strokeWidth="10"
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
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF729F]">
                {timer.state === "active"
                  ? "🎧 Deep Focus"
                  : timer.state === "paused"
                  ? "☕ On Break"
                  : selectedMode === "pomodoro"
                  ? "🍅 Pomodoro"
                  : "⏱️ Flow Session"}
              </span>

              <h1 className="text-4xl sm:text-5xl font-black tracking-tight font-mono text-[#4A3E4D] dark:text-[#F8F1FF] drop-shadow-xs">
                {timer.state === "idle"
                  ? selectedMode === "pomodoro"
                    ? `${targetMinutes}:00`
                    : "00:00"
                  : timer.formattedDisplay}
              </h1>

              <span className="text-xs font-semibold text-[#8C7B8E] dark:text-[#B9AEC9] max-w-[130px] truncate">
                {timer.session?.subject_tag || subjectTag}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Subject Tag Selector & Control Actions */}
      <div className="pt-4 border-t border-[#F0E4DE] dark:border-[#352B46] flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Subject Pill Picker */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
          <BookOpen className="w-4 h-4 text-[#FF729F] shrink-0" />
          {timer.state === "idle" ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_SUBJECTS.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSubjectTag(sub)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    subjectTag === sub
                      ? "bg-[#FFEBF0] dark:bg-[#4A263D] text-[#FF729F] border border-[#FF729F]/40"
                      : "bg-[#FFF5F8] dark:bg-[#1D1729] text-[#7D6E7E] dark:text-[#B9AEC9] border border-[#E9DFD8] dark:border-[#40354F]"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-xs font-bold text-[#4A3E4D] dark:text-[#F8F1FF]">
              Studying: <strong className="text-[#FF729F]">{timer.session?.subject_tag}</strong>
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {timer.state === "idle" && (
            <button
              onClick={() => timer.start(selectedMode, targetMinutes, subjectTag)}
              disabled={timer.actionLoading}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-[#FF729F] to-[#F25577] hover:from-[#FF5D8F] hover:to-[#E04468] text-white font-black text-sm shadow-md shadow-[#FF729F]/30 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Studying</span>
            </button>
          )}

          {timer.state === "active" && (
            <>
              <button
                onClick={timer.pause}
                disabled={timer.actionLoading}
                className="px-5 py-2.5 rounded-2xl bg-[#FFF8E5] dark:bg-[#4A381C] text-[#D99B16] dark:text-[#F6D28B] border border-[#D99B16]/30 font-bold text-xs hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>

              <button
                onClick={() => timer.stop()}
                disabled={timer.actionLoading}
                className="px-5 py-2.5 rounded-2xl bg-[#FFEBF0] dark:bg-[#4A263D] text-[#FF729F] border border-[#FF729F]/30 font-bold text-xs hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-[#FF729F]" />
                <span>Finish</span>
              </button>
            </>
          )}

          {timer.state === "paused" && (
            <>
              <button
                onClick={timer.resume}
                disabled={timer.actionLoading}
                className="px-6 py-2.5 rounded-2xl bg-[#EAF5EE] dark:bg-[#1A3826] text-[#2E7D4E] dark:text-[#91E6C1] border border-[#2E7D4E]/30 font-bold text-xs hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume</span>
              </button>

              <button
                onClick={() => timer.stop()}
                disabled={timer.actionLoading}
                className="px-5 py-2.5 rounded-2xl bg-[#FFEBF0] dark:bg-[#4A263D] text-[#FF729F] border border-[#FF729F]/30 font-bold text-xs hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-[#FF729F]" />
                <span>End</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
