"use client";

import React from "react";
import Link from "next/link";
import { FocusieLogo } from "@/components/ui/FocusieLogo";

interface FooterProps {
  onScrollToTop?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollToTop }) => {
  const handleScrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onScrollToTop) {
      onScrollToTop();
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-[#FFFDF9] dark:bg-[#171321] border-t border-[#F2E8E2] dark:border-[#40354F] pt-14 pb-10 text-[#7D6E7E] dark:text-[#B9AEC9] transition-colors" id="faq">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-[#F4ECE5] dark:border-[#40354F]">
          {/* Brand Info (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-start">
            <button
              onClick={handleScrollToTop}
              className="flex items-center gap-2.5 group cursor-pointer focus:outline-none mb-4 text-left"
              aria-label="Focie - Scroll to top"
            >
              <div className="relative w-8 h-8 flex items-center justify-center">
                <FocusieLogo size={30} />
              </div>
              <span className="font-display text-2xl font-extrabold text-[#4A3E4D] dark:text-[#F8F1FF] group-hover:text-[#FF729F] transition-colors">
                Focie
              </span>
            </button>

            <p className="text-sm text-[#8C7B8E] dark:text-[#B9AEC9] max-w-sm leading-relaxed mb-4">
              A cozy, kawaii study-with-friends web app. Track focused sessions,
              stay accountable with personal study days, and cheer on each
              other every day.
            </p>

            <div className="text-xs font-semibold text-[#FF729F]">
              Focus feels better together. ♡
            </div>
          </div>

          {/* Links: Features (3 cols) */}
          <div className="md:col-span-3">
            <h4 className="font-display text-sm font-bold text-[#4A3E4D] dark:text-[#F8F1FF] mb-4">
              Features
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li>
                <a href="#features" className="hover:text-[#FF729F] transition-colors">
                  Live Study Timers
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#FF729F] transition-colors">
                  Personal 24-Hour Day
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#FF729F] transition-colors">
                  Fair Leaderboards
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#FF729F] transition-colors">
                  Virtual Gifts & Rooms
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#FF729F] transition-colors">
                  Growing Companion
                </a>
              </li>
            </ul>
          </div>

          {/* Links: Platform & Community (4 cols) */}
          <div className="md:col-span-4 flex flex-col justify-between">
            <div>
              <h4 className="font-display text-sm font-bold text-[#4A3E4D] dark:text-[#F8F1FF] mb-4">
                Community
              </h4>
              <p className="text-xs leading-relaxed mb-4">
                Have questions, feature requests or want to meet fellow study buddies?
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/register"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#FF729F] hover:bg-[#F25577] dark:hover:bg-[#FF5D8F] rounded-full shadow-2xs"
                >
                  Join Focie
                </Link>
                <button
                  onClick={handleScrollToTop}
                  className="px-4 py-2 text-xs font-bold text-[#4A3E4D] dark:text-[#F8F1FF] bg-white dark:bg-[#241D33] border border-[#E9DFD8] dark:border-[#40354F] hover:bg-[#FAF6F2] dark:hover:bg-[#302641] rounded-full shadow-2xs cursor-pointer"
                >
                  ↑ Back to top
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 Focie. All rights reserved. Crafted with care for study besties.</p>
          <div className="flex items-center gap-5">
            <button
              onClick={handleScrollToTop}
              className="text-[#FF729F] hover:underline font-bold cursor-pointer"
            >
              Focie ⭐
            </button>
            <span>•</span>
            <span>Midnight Kawaii & Sunny Study</span>
            <span>•</span>
            <span>Privacy First</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
