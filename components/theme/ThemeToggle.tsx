"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme, Theme } from "@/context/ThemeContext";

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options: { value: Theme; label: string; icon: React.ReactNode; sublabel: string }[] = [
    {
      value: "light",
      label: "Sunny Study",
      icon: <Sun className="w-4 h-4 text-[#FF729F]" />,
      sublabel: "Warm Cream & Pastel",
    },
    {
      value: "dark",
      label: "Midnight Kawaii",
      icon: <Moon className="w-4 h-4 text-[#C5A7FF]" />,
      sublabel: "Dreamy Night Vibe",
    },
    {
      value: "system",
      label: "System",
      icon: <Laptop className="w-4 h-4 text-[#B9AEC9]" />,
      sublabel: "Match Device Setting",
    },
  ];

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Toggle theme mode"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#241D33] border border-[#E9DFD8] dark:border-[#40354F] text-[#4A3E4D] dark:text-[#F8F1FF] hover:bg-[#FAF6F2] dark:hover:bg-[#302641] shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF729F]"
      >
        <div className="flex items-center justify-center">
          {resolvedTheme === "dark" ? (
            <Moon className="w-4 h-4 text-[#C5A7FF]" />
          ) : (
            <Sun className="w-4 h-4 text-[#FF729F]" />
          )}
        </div>
        <span className="text-xs font-bold hidden sm:inline">
          {theme === "system" ? "Auto" : theme === "dark" ? "Midnight" : "Sunny"}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-[#241D33] border border-[#F0E4DE] dark:border-[#40354F] shadow-lg p-1.5 z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#8C7B8E] dark:text-[#B9AEC9] border-b border-[#F5ECE5] dark:border-[#352B46] mb-1">
            Choose Theme
          </div>

          {options.map((opt) => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                role="menuitem"
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#FFEBF0] dark:bg-[#4A263D] text-[#FF537A] dark:text-[#FF729F] font-bold"
                    : "text-[#4A3E4D] dark:text-[#F8F1FF] hover:bg-[#FAF6F2] dark:hover:bg-[#302641]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex-shrink-0">{opt.icon}</span>
                  <div>
                    <div className="text-xs font-bold leading-tight">{opt.label}</div>
                    <div className="text-[10px] text-[#8C7B8E] dark:text-[#B9AEC9] leading-tight">
                      {opt.sublabel}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-[#FF729F] flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};