"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FocusieLogo } from "@/components/ui/FocusieLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface HeaderProps {
  onScrollToTop?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onScrollToTop }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onScrollToTop) {
      onScrollToTop();
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFFDF9]/90 dark:bg-[#171321]/90 backdrop-blur-md border-b border-[#F3E8E2]/80 dark:border-[#40354F] shadow-2xs transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
        {/* Logo (tapping anywhere redirects/scrolls to the top smoothly) */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF729F] rounded-xl px-2 py-1 transition-transform active:scale-95 text-left"
          aria-label="Focie - Scroll to top"
        >
          <div className="relative w-9 h-9 flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
            <FocusieLogo size={34} />
          </div>
          <span className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#4A3E4D] dark:text-[#F8F1FF] group-hover:text-[#FF729F] transition-colors">
            Focie
          </span>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={handleLogoClick}
            className="text-sm font-bold text-[#FF729F] border-b-2 border-[#FF729F] pb-1 cursor-pointer"
          >
            Home
          </button>
          <a
            href="#features"
            className="text-sm font-semibold text-[#7D6E7E] dark:text-[#B9AEC9] hover:text-[#4A3E4D] dark:hover:text-[#F8F1FF] transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-semibold text-[#7D6E7E] dark:text-[#B9AEC9] hover:text-[#4A3E4D] dark:hover:text-[#F8F1FF] transition-colors"
          >
            How it works
          </a>
          <a
            href="#faq"
            className="text-sm font-semibold text-[#7D6E7E] dark:text-[#B9AEC9] hover:text-[#4A3E4D] dark:hover:text-[#F8F1FF] transition-colors"
          >
            FAQ
          </a>
        </nav>

        {/* Auth Buttons & Theme Toggle */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Theme Toggle (Light / Dark / System) */}
          <ThemeToggle />

          <Link
            href="/login"
            className="px-5 py-2 text-sm font-semibold text-[#4A3E4D] dark:text-[#F8F1FF] bg-white dark:bg-[#241D33] border border-[#E9DFD8] dark:border-[#40354F] hover:border-[#D8CAC0] dark:hover:border-[#534666] hover:bg-[#FAF6F2] dark:hover:bg-[#302641] rounded-full shadow-2xs transition-all active:scale-98"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="px-6 py-2 text-sm font-bold text-white bg-[#FF729F] hover:bg-[#F25577] dark:hover:bg-[#FF5D8F] rounded-full shadow-sm hover:shadow-md transition-all active:scale-98"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu & Theme Toggle */}
        <div className="sm:hidden flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/register"
            className="px-4 py-1.5 text-xs font-bold text-white bg-[#FF729F] rounded-full"
          >
            Get Started
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#4A3E4D] dark:text-[#F8F1FF] focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#FFFDF9] dark:bg-[#1D1729] border-b border-[#F3E8E2] dark:border-[#40354F] px-6 py-4 flex flex-col gap-3 shadow-lg">
          <button
            onClick={(e) => {
              handleLogoClick(e);
              setMobileMenuOpen(false);
            }}
            className="text-left py-2 font-bold text-[#FF729F]"
          >
            Home
          </button>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 font-semibold text-[#7D6E7E] dark:text-[#B9AEC9]"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 font-semibold text-[#7D6E7E] dark:text-[#B9AEC9]"
          >
            How it works
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 font-semibold text-[#7D6E7E] dark:text-[#B9AEC9]"
          >
            FAQ
          </a>
          <div className="pt-2 border-t border-[#F3E8E2] dark:border-[#40354F] flex items-center justify-between gap-3">
            <Link
              href="/login"
              className="w-full text-center py-2 text-sm font-semibold text-[#4A3E4D] dark:text-[#F8F1FF] bg-white dark:bg-[#241D33] border border-[#E9DFD8] dark:border-[#40354F] rounded-full"
            >
              Log in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
