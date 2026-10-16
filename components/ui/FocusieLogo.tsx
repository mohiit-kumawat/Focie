import React from "react";

interface FocusieLogoProps {
  size?: number;
  className?: string;
}

export const FocusieLogo: React.FC<FocusieLogoProps> = ({
  size = 32,
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
    >
      <defs>
        <linearGradient id="starGrad" x1="12" y1="6" x2="36" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFECA8" />
          <stop offset="1" stopColor="#FFCE52" />
        </linearGradient>
      </defs>

      {/* Soft rounded kawaii star body */}
      <path
        d="M24 4.5C24.7 4.5 25.4 5 25.8 5.7L30.5 15.3C30.7 15.7 31.1 16 31.6 16.1L42.2 17.6C43.1 17.7 43.8 18.5 43.9 19.3C43.9 19.8 43.7 20.3 43.4 20.6L35.7 28.1C35.3 28.5 35.2 29 35.3 29.5L37.1 40C37.3 40.9 36.8 41.7 36 42.1C35.6 42.3 35.1 42.3 34.6 42L25.1 37C24.7 36.8 24.2 36.8 23.8 37L14.3 42C13.8 42.3 13.3 42.3 12.9 42.1C12.1 41.7 11.6 40.9 11.8 40L13.6 29.5C13.7 29 13.5 28.5 13.2 28.1L5.5 20.6C5.1 20.3 4.9 19.8 5 19.3C5.1 18.5 5.8 17.7 6.7 17.6L17.3 16.1C17.7 16 18.2 15.7 18.4 15.3L23.1 5.7C23.5 5 24.2 4.5 24 4.5Z"
        fill="url(#starGrad)"
        stroke="#E6A817"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Cute twinkling eyes */}
      <ellipse cx="19" cy="23" rx="2" ry="2.6" fill="#4A3E4D" />
      <circle cx="19.7" cy="22" r="0.9" fill="#FFFFFF" />

      <ellipse cx="29" cy="23" rx="2" ry="2.6" fill="#4A3E4D" />
      <circle cx="29.7" cy="22" r="0.9" fill="#FFFFFF" />

      {/* Cheerful Smile */}
      <path
        d="M21.5 27.5C22.8 29.2 25.2 29.2 26.5 27.5"
        stroke="#4A3E4D"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Soft Rosy Cheeks */}
      <circle cx="15.5" cy="26" r="2.2" fill="#FF8CA3" fillOpacity="0.75" />
      <circle cx="32.5" cy="26" r="2.2" fill="#FF8CA3" fillOpacity="0.75" />
    </svg>
  );
};

