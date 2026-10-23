"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Headphones,
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Zap,
  Radio,
  Sliders,
} from "lucide-react";
import {
  focusMusicEngine,
  FOCUS_TRACKS,
  type FocusMusicState,
  type FocusTrack,
} from "@/lib/audio/focus-music";

interface FocusAudioPlayerProps {
  timerState?: "idle" | "active" | "paused" | "completed" | string;
}

export function FocusAudioPlayer({ timerState = "idle" }: FocusAudioPlayerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<FocusMusicState>(() => focusMusicEngine.getState());
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = focusMusicEngine.subscribe(setState);
    return () => unsubscribe();
  }, []);

  // Auto-play / stop based on timer state if autoPlayWithTimer is enabled
  useEffect(() => {
    if (!state.autoPlayWithTimer) return;

    if (timerState === "active" && !state.isPlaying) {
      focusMusicEngine.play();
    } else if (timerState === "idle" && state.isPlaying) {
      focusMusicEngine.pause();
    }
  }, [timerState, state.autoPlayWithTimer, state.isPlaying]);

  // Close popover when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const activeTrack = focusMusicEngine.getActiveTrack();

  return (
    <div className="relative inline-block" ref={drawerRef}>
      {/* Pill Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer shadow-2xs border ${
          state.isPlaying
            ? "bg-[#FFEBF0] dark:bg-[#FF729F]/20 text-[#FF729F] border-[#FF729F]/60 scale-102"
            : "bg-white dark:bg-[#302641] text-[#7D6E7E] dark:text-[#B9AEC9] border-[#E9DFD8] dark:border-[#40354F] hover:border-[#FF729F]/50 hover:text-[#FF729F]"
        }`}
        title="Open Study Audio player"
      >
        <Headphones
          className={`w-3.5 h-3.5 ${
            state.isPlaying ? "text-[#FF729F] animate-bounce" : "text-[#8C7B8E] dark:text-[#B9AEC9]"
          }`}
        />
        <span className="truncate max-w-[110px] sm:max-w-[140px]">
          {state.isPlaying ? activeTrack.name : "Study Audio"}
        </span>

        {state.isPlaying ? (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2EB562] animate-ping" />
            <span className="text-[10px] font-extrabold uppercase text-[#2EB562]">On</span>
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-[#8C7B8E] dark:text-[#887995]">Off</span>
        )}
      </button>

      {/* Popover Music Controls Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-92 z-50 rounded-2xl bg-white dark:bg-[#20182E] border border-[#F0E4DE] dark:border-[#40354F] shadow-2xl p-4 space-y-3.5 text-[#4A3E4D] dark:text-[#F8F1FF]"
          >
            {/* Header: Title + Play/Pause Quick Button */}
            <div className="flex items-center justify-between pb-2 border-b border-[#F0E4DE] dark:border-[#352B46]">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#FF729F]" />
                <h3 className="text-xs font-black">Focus Audio Suite</h3>
                <span className="text-[9px] font-black uppercase tracking-wider text-[#91E6C1] bg-[#182B24] px-1.5 py-0.5 rounded-md">
                  Alert & Rhythmic
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-[#8C7B8E] hover:text-[#FF729F] cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Currently Playing Card */}
            <div className="p-3 rounded-xl bg-[#FFF5F8] dark:bg-[#2A203B] border border-[#FF729F]/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl">{activeTrack.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{activeTrack.name}</p>
                  <p className="text-[10px] text-[#8C7B8E] dark:text-[#B9AEC9] truncate">
                    {activeTrack.bpm ? `${activeTrack.bpm} BPM Cadence` : "Cognitive Wave"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => focusMusicEngine.togglePlay()}
                disabled={state.isBuffering}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF729F] to-[#F25577] text-white text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
              >
                {state.isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play</span>
                  </>
                )}
              </button>
            </div>

            {/* Volume Slider Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#8C7B8E] dark:text-[#B9AEC9]">
                <span className="flex items-center gap-1.5">
                  {state.volume === 0 ? (
                    <VolumeX className="w-3.5 h-3.5 text-[#FF729F]" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-[#FF729F]" />
                  )}
                  Volume
                </span>
                <span>{Math.round(state.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={state.volume}
                onChange={(e) => focusMusicEngine.setVolume(parseFloat(e.target.value))}
                className="w-full accent-[#FF729F] h-1.5 bg-[#F0E4DE] dark:bg-[#40354F] rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Track Switcher List */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C7B8E] dark:text-[#B9AEC9]">
                Choose Alert Focus Stream:
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {FOCUS_TRACKS.map((track) => {
                  const isSelected = track.id === state.activeTrackId;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => focusMusicEngine.setTrack(track.id)}
                      className={`w-full p-2 rounded-xl text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                        isSelected
                          ? "bg-[#FFEBF0] dark:bg-[#FF729F]/20 border border-[#FF729F]/50 text-[#FF729F]"
                          : "bg-white dark:bg-[#271E36] border border-[#F0E4DE] dark:border-[#40354F] hover:border-[#FF729F]/40 text-[#4A3E4D] dark:text-[#F8F1FF]"
                      }`}
                    >
                      <span className="text-lg mt-0.5">{track.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold truncate">{track.name}</p>
                          {isSelected && state.isPlaying && (
                            <span className="w-2 h-2 rounded-full bg-[#2EB562] animate-pulse shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-[#8C7B8E] dark:text-[#B9AEC9] line-clamp-1">
                          {track.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Auto-Play Toggle Checkbox */}
            <div className="pt-2 border-t border-[#F0E4DE] dark:border-[#352B46] flex items-center justify-between text-xs">
              <label
                htmlFor="autoplay-timer-toggle"
                className="text-[11px] font-bold text-[#4A3E4D] dark:text-[#B9AEC9] cursor-pointer select-none flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-[#FF729F]" />
                Auto-play when study timer starts
              </label>
              <input
                id="autoplay-timer-toggle"
                type="checkbox"
                checked={state.autoPlayWithTimer}
                onChange={(e) => focusMusicEngine.setAutoPlayWithTimer(e.target.checked)}
                className="w-4 h-4 accent-[#FF729F] rounded-md cursor-pointer"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
