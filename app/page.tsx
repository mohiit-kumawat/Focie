import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FumiMascot } from "@/components/ui/FumiMascot";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-cream text-plum">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-cream/80 border-b border-plum/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FumiMascot size={38} state="happy" />
            <span className="font-display text-2xl font-bold tracking-tight text-plum">
              Focusie
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="#features">
              <Button variant="ghost" size="sm">
                Features
              </Button>
            </Link>
            <Link href="#get-started">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
            {/* Mascot Centerpiece */}
            <div className="mb-6 animate-bounce [animation-duration:3s]">
              <FumiMascot size={160} state="idle" />
            </div>

            {/* Tagline & Headline */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lavender/60 border border-lavender text-xs font-semibold text-plum mb-6">
              <span>✨</span>
              <span>Cute, not childish • Focus feels better together</span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-plum max-w-2xl leading-tight">
              A cozy, pastel study sanctuary for you & your friends.
            </h1>

            <p className="mt-5 text-base sm:text-lg text-mauve max-w-xl">
              Track focused study sessions with reliable timers, cheer on your friends
              in real-time, and compete fairly on synchronized leaderboards.
            </p>

            {/* Action Controls */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4" id="get-started">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                🌸 Start Your Focus Session
              </Button>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                🍵 Study Rooms
              </Button>
            </div>
          </div>
        </section>

        {/* Core Principles / Features Section */}
        <section id="features" className="py-16 bg-white/40 border-t border-plum/5">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-plum">
                Built for genuine progress, not guilt
              </h2>
              <p className="text-mauve text-sm sm:text-base mt-2">
                Server-authoritative tracking with warmth and encouragement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card variant="blush">
                <div className="text-2xl mb-3">⏱️</div>
                <h3 className="font-display text-lg font-bold text-plum mb-2">
                  Tamper-proof Timer
                </h3>
                <p className="text-sm text-mauve">
                  Server-authoritative timestamps guarantee your study time survives refreshes and network changes without false claims.
                </p>
              </Card>

              <Card variant="lavender">
                <div className="text-2xl mb-3">👥</div>
                <h3 className="font-display text-lg font-bold text-plum mb-2">
                  Live Friend Activity
                </h3>
                <p className="text-sm text-mauve">
                  See when friends are in the zone, take synchronized breaks, and send virtual gifts to celebrate milestones.
                </p>
              </Card>

              <Card variant="butter">
                <div className="text-2xl mb-3">☀️</div>
                <h3 className="font-display text-lg font-bold text-plum mb-2">
                  Personal Study Days
                </h3>
                <p className="text-sm text-mauve">
                  Night owl or early bird? Configure your personal 24-hour study day so midnight never resets your streak unfairly.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-plum/10 py-8 bg-cream/90 text-center text-xs text-mauve">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>© 2026 Focusie.</span>
            <span>All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Server-Authoritative Focus</span>
            <span>•</span>
            <span>Kawaii Aesthetic</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
