"use client";

import React, { useCallback } from "react";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { AppPreviewSection } from "@/components/landing/AppPreviewSection";
import { FeaturesGridSection } from "@/components/landing/FeaturesGridSection";
import { CtaBannerSection } from "@/components/landing/CtaBannerSection";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  return (
    <div
      id="top"
      className="flex flex-col min-h-screen bg-[#FFFDF9] dark:bg-[#171321] text-[#4A3E4D] dark:text-[#F8F1FF] selection:bg-[#FFEBF0] dark:selection:bg-[#4A263D] selection:text-[#FF729F] transition-colors"
    >
      {/* Sticky Header with Logo Click -> Scroll to Top + Theme Toggle */}
      <Header onScrollToTop={scrollToTop} />

      {/* Main Content Sections (streamlined, no redundant repeating features) */}
      <main className="flex-1">
        {/* 1. Hero Section with Interactive Timer & Fumi Focal Point */}
        <HeroSection />

        {/* 2. App Mockup & Features Showcase ("More than just a timer.") */}
        <AppPreviewSection />

        {/* 3. In-Depth Features Grid ("Everything you need for a happier study journey ♡") */}
        <FeaturesGridSection />

        {/* 4. Bottom Panoramic CTA Banner ("Your study story starts here.") */}
        <CtaBannerSection />
      </main>

      {/* 5. Cozy Footer */}
      <Footer onScrollToTop={scrollToTop} />
    </div>
  );
}
