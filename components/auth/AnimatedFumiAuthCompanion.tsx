"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

export type FumiAuthStage = "peek" | "celebrate" | "idle";

interface AnimatedFumiAuthCompanionProps {
  className?: string;
  onStageChange?: (stage: FumiAuthStage) => void;
}

export const AnimatedFumiAuthCompanion: React.FC<AnimatedFumiAuthCompanionProps> = ({
  className = "",
  onStageChange,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // If user prefers reduced motion, start directly in peaceful idle
  const [stage, setStage] = useState<FumiAuthStage>(() =>
    shouldReduceMotion ? "idle" : "peek"
  );
  const [showBubble, setShowBubble] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);

  useEffect(() => {
    onStageChange?.(stage);
  }, [stage, onStageChange]);

  useEffect(() => {
    if (shouldReduceMotion) return;

    // Timeline:
    // 1. Initial Peaceful Peek (0ms - 900ms): Peeks curiosity over the card rim
    // 2. Gentle Emergence & Greeting (900ms - 3200ms): Glides up and celebrates warmly
    const celebTimer = setTimeout(() => {
      setStage("celebrate");
    }, 900);

    // Speech Bubble pops in smoothly at 1300ms
    const bubbleTimer = setTimeout(() => {
      setShowBubble(true);
    }, 1300);

    // Speech Bubble fades out at 3000ms
    const hideBubbleTimer = setTimeout(() => {
      setShowBubble(false);
    }, 3000);

    // 3. Settle gracefully into peaceful, serene companion idle at 3400ms
    const idleTimer = setTimeout(() => {
      setStage("idle");
    }, 3400);

    return () => {
      clearTimeout(celebTimer);
      clearTimeout(bubbleTimer);
      clearTimeout(hideBubbleTimer);
      clearTimeout(idleTimer);
    };
  }, [shouldReduceMotion]);

  // Click handler: Spawn floating hearts
  const handleFumiClick = () => {
    const id = Date.now();
    const randomOffset = (Math.random() - 0.5) * 36;
    setHearts((prev) => [...prev, { id, x: randomOffset }]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1200);
  };

  return (
    <div
      className={`relative select-none ${className}`}
      aria-label="Fumi the Focie mascot companion"
    >
      {/* Floating Hearts spawned on click */}
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ scale: 0.6, y: 0, x: heart.x, opacity: 1 }}
            animate={{ scale: 1.25, y: -65, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="absolute -top-4 left-1/2 pointer-events-none z-40 text-lg"
          >
            💖
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Floating Kawaii Speech Bubble */}
      <AnimatePresence>
        {showBubble && !shouldReduceMotion && (
          <motion.div
            initial={{ scale: 0.5, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{
              scale: 0.85,
              y: -4,
              opacity: 0,
              transition: { duration: 0.28, ease: "easeOut" },
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 22,
              mass: 0.8,
            }}
            className="absolute -top-12 sm:-top-14 right-1 sm:-right-4 z-40 pointer-events-none"
          >
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="relative px-4 py-1.5 rounded-2xl bg-white/95 dark:bg-[#261D36]/95 border border-[#FF729F]/40 dark:border-[#FF729F]/45 shadow-xl shadow-pink-500/20 flex items-center gap-1.5 text-xs font-black text-[#4A3E4D] dark:text-[#F8F1FF] backdrop-blur-md select-none"
            >
              <span>Hii, bestie!</span>
              <span className="text-[#FF729F]">✨</span>
              {/* Cute speech bubble pointer tail */}
              <div className="absolute -bottom-1.5 left-5 w-2.5 h-2.5 bg-white dark:bg-[#261D36] border-r border-b border-[#FF729F]/40 dark:border-[#FF729F]/45 transform rotate-45" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Mascot Motion Rig (Peaceful, Silky Physics) */}
      <motion.div
        className="relative cursor-pointer"
        onClick={handleFumiClick}
        whileHover={{ scale: 1.035, y: -2 }}
        whileTap={{ scale: 0.95 }}
        initial={
          shouldReduceMotion
            ? { y: 0, opacity: 1 }
            : { y: 54, scaleY: 0.96, scaleX: 1.02, opacity: 1 }
        }
        animate={
          shouldReduceMotion
            ? { y: 0, opacity: 1 }
            : stage === "peek"
            ? {
                // Stage 1: Gentle, curious peek from behind the card rim
                y: [54, 56, 52, 54],
                rotate: [0, -1.8, 1.8, 0],
                scaleY: [0.96, 0.98, 0.96],
                scaleX: [1.02, 1.01, 1.02],
                transition: {
                  duration: 0.9,
                  ease: "easeInOut",
                },
              }
            : stage === "celebrate"
            ? {
                // Stage 2: Smooth, graceful pop up & emergence from behind the card
                y: [54, -32, 0],
                scaleY: [0.96, 1.06, 1],
                scaleX: [1.02, 0.95, 1],
                rotate: [0, 3, -2, 1, 0],
                transition: {
                  times: [0, 0.52, 1],
                  duration: 1.4,
                  ease: [0.22, 1, 0.36, 1],
                },
              }
            : {
                // Stage 3: Serene resting idle on the card rim (Peaceful 4.8s breathing)
                y: [0, -2, 0],
                scaleY: [1, 1.015, 1],
                scaleX: [1, 0.992, 1],
                transition: {
                  repeat: Infinity,
                  duration: 4.8,
                  ease: "easeInOut",
                },
              }
        }
      >
        {/* Soft Warm Ethereal Backlight behind Fumi */}
        <div className="absolute -inset-4 rounded-full bg-gradient-to-t from-[#FF729F]/25 via-[#C5A7FF]/15 to-transparent blur-2xl pointer-events-none" />

        {/* Unified 3D Clay Mascot Frame (Width: 160px, Height: 186px) */}
        <div className="relative w-[155px] h-[180px] sm:w-[165px] sm:h-[192px]">
          {/* POSE A: CELEBRATING / WAVING (Joyful arms in the air) */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: stage === "celebrate" ? 1 : 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
          >
            <Image
              src="/images/mascot/fumi-celebrating-clean.webp"
              alt="Fumi happily waving hello"
              fill
              priority
              sizes="165px"
              className="object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.4)] select-none"
            />
          </motion.div>

          {/* POSE B: PEACEFUL SITTING IDLE (Resting serenely on card rim) */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: stage === "celebrate" ? 0 : 1 }}
            transition={{ duration: 0.48, ease: "easeInOut" }}
          >
            <Image
              src="/images/mascot/fumi-white-clean.webp"
              alt="Fumi sweet cream mascot resting on the card"
              fill
              priority
              sizes="165px"
              className="object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.4)] select-none"
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};