import React from "react";
import Image from "next/image";

export type FumiState =
  | "idle"
  | "studying"
  | "headphones"
  | "sleeping"
  | "celebrating";

export interface FumiMascotProps {
  state?: FumiState;
  size?: number;
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
  priority?: boolean;
}

const MASCOT_ASSETS: Record<FumiState, { src: string; defaultAlt: string }> = {
  idle: {
    src: "/images/mascot/fumi-idle.webp?v=2",
    defaultAlt: "Fumi the study mascot smiling warmly",
  },
  studying: {
    src: "/images/mascot/fumi-studying.webp?v=2",
    defaultAlt: "Fumi studying at a cozy pastel desk with a book and pencil",
  },
  headphones: {
    src: "/images/mascot/fumi-headphones.webp?v=2",
    defaultAlt: "Fumi wearing lavender headphones immersed in focus",
  },
  sleeping: {
    src: "/images/mascot/fumi-sleeping.webp?v=2",
    defaultAlt: "Fumi resting peacefully during a study break",
  },
  celebrating: {
    src: "/images/mascot/fumi-celebrating.webp?v=2",
    defaultAlt: "Fumi celebrating a completed study session milestone",
  },
};

export const FumiMascot: React.FC<FumiMascotProps> = ({
  state = "idle",
  size = 140,
  width,
  height,
  alt,
  className = "",
  priority = false,
}) => {
  const finalWidth = width ?? size;
  const finalHeight = height ?? size;
  const asset = MASCOT_ASSETS[state] ?? MASCOT_ASSETS.idle;
  const altText = alt ?? asset.defaultAlt;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: finalWidth, height: finalHeight }}
    >
      {/* Soft ambient lavender rim light */}
      <div className="absolute inset-1 rounded-full bg-[#C5A7FF]/10 dark:bg-[#C5A7FF]/15 blur-xl pointer-events-none" />

      <Image
        src={asset.src}
        alt={altText}
        width={finalWidth}
        height={finalHeight}
        priority={priority}
        unoptimized
        className="w-full h-full object-contain relative z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_8px_24px_rgba(197,167,255,0.22)] transition-transform duration-300 hover:scale-105"
      />
    </div>
  );
};
