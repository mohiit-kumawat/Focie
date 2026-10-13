import React from "react";

interface FumiMascotProps {
  state?: "idle" | "studying" | "happy" | "resting";
  size?: number;
  className?: string;
}

export const FumiMascot: React.FC<FumiMascotProps> = ({
  state = "idle",
  size = 140,
  className = "",
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      aria-label={`Fumi the study mascot (${state})`}
      role="img"
    >
      <svg
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Soft shadow base */}
        <ellipse cx="80" cy="144" rx="46" ry="10" fill="#514453" fillOpacity="0.12" />

        {/* Fumi Body (Squishy rounded bean/circle) */}
        <path
          d="M80 24C44 24 30 52 30 88C30 126 50 140 80 140C110 140 130 126 130 88C130 52 116 24 80 24Z"
          fill="#FFFBF5"
          stroke="#E7E0FA"
          strokeWidth="4"
        />

        {/* Distinctive Star Detail on ear/side */}
        <g transform="translate(112, 38) rotate(15)">
          <polygon
            points="0,-10 3,-3 10,0 3,3 0,10 -3,3 -10,0 -3,-3"
            fill="#F9EDC7"
            stroke="#514453"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>

        {/* Soft Cheeks (Blush) */}
        <circle cx="50" cy="94" r="8" fill="#F7DCE7" />
        <circle cx="110" cy="94" r="8" fill="#F7DCE7" />

        {/* Expressive Eyes */}
        {state === "happy" || state === "resting" ? (
          <>
            {/* Happy curved eyes */}
            <path
              d="M58 84C62 80 68 80 72 84"
              stroke="#514453"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M88 84C92 80 98 80 102 84"
              stroke="#514453"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            {/* Round open eyes with twinkle */}
            <circle cx="65" cy="82" r="5" fill="#514453" />
            <circle cx="67" cy="80" r="1.8" fill="#FFFFFF" />
            <circle cx="95" cy="82" r="5" fill="#514453" />
            <circle cx="97" cy="80" r="1.8" fill="#FFFFFF" />
          </>
        )}

        {/* Cute Mouth */}
        <path
          d="M75 92C78 95 82 95 85 92"
          stroke="#514453"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Little study hat or accessory for studying state */}
        {state === "studying" && (
          <path
            d="M68 28L92 28L80 16Z"
            fill="#F7DCE7"
            stroke="#514453"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
};
