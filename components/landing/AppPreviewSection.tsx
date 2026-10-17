"use client";

import React, { useState } from "react";
import {
  Bell,
  Home,
  BookOpen,
  Users,
  Trophy,
  Gift,
  Sprout,
  Settings,
  Send,
  Sparkles,
  Flame,
  Heart,
  Music,
} from "lucide-react";
import { FumiMascot } from "@/components/ui/FumiMascot";

interface ChatMessage {
  sender: string;
  avatar: string;
  color: string;
  text: string;
}

export const AppPreviewSection: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "Bestie",
      avatar: "🌸",
      color: "text-[#D84A6E] dark:text-[#FF729F]",
      text: "Let's do one more session! 💗",
    },
    {
      sender: "Aarav",
      avatar: "🍵",
      color: "text-[#D99B16] dark:text-[#F6D28B]",
      text: "You got this!! ⭐",
    },
    {
      sender: "Tara",
      avatar: "✨",
      color: "text-[#2EB562] dark:text-[#91E6C1]",
      text: "So close to the goal! ✨",
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        sender: "You",
        avatar: "🐰",
        color: "text-[#FF729F]",
        text: inputMessage.trim(),
      },
    ]);
    setInputMessage("");
  };

  return (
    <section
      className="py-16 sm:py-24 bg-gradient-to-b from-[#FFFDF9] via-[#FFF6FA] to-[#FFFBF8] dark:from-[#171321] dark:via-[#1D1729] dark:to-[#171321] relative overflow-hidden transition-colors"
      id="how-it-works"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-start text-left">
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-[#4A3E4D] dark:text-[#F8F1FF] leading-tight">
              More than just <br />
              <span className="text-[#FF729F]">a timer.</span>
            </h2>

            <p className="mt-4 text-sm sm:text-base text-[#7D6E7E] dark:text-[#B9AEC9] leading-relaxed">
              Focie turns your study time into a shared journey. Stay
              motivated with your friends, earn rewards, and create your own
              cozy study world.
            </p>

            {/* Companion Showcase Card */}
            <div className="hover-lift mt-8 w-full max-w-sm rounded-3xl bg-white dark:bg-[#241D33] border border-[#F4E3EC] dark:border-[#40354F] hover:border-[#FF729F]/60 dark:hover:border-[#C5A7FF]/60 p-5 shadow-sm hover:shadow-xl hover:shadow-pink-500/10 dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(197,167,255,0.15)] relative cursor-pointer group select-none transition-colors">
              <div className="flex items-center gap-4">
                <div className="relative p-1 rounded-2xl bg-[#FFF8FA] dark:bg-white/95 border border-[#F4E3EC] dark:border-[#FF729F]/30 shadow-2xs overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <FumiMascot size={86} state="idle" />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FFEBF0] dark:bg-[#4A263D] text-[#FF729F] text-[10px] flex items-center justify-center font-bold shadow-2xs">
                    Lv.4
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#4A3E4D] dark:text-[#F8F1FF] group-hover:text-[#FF729F] transition-colors">
                      Fumi Companion
                    </span>
                    <span className="hover-lift-pill inline-flex items-center gap-1 text-[10px] font-bold text-[#D99B16] dark:text-[#F6D28B] bg-[#FFF8E5] dark:bg-[#4A381C] px-2 py-0.5 rounded-full shadow-2xs cursor-pointer">
                      <Flame className="w-3 h-3 text-[#D99B16] dark:text-[#F6D28B] group-hover:animate-bounce" /> 5-Day Streak
                    </span>
                  </div>

                  <p className="text-[11px] text-[#8C7B8E] dark:text-[#B9AEC9] mt-0.5">
                    Cozy Scholar • Happy Spirit
                  </p>

                  {/* Level progress bar */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-[#8C7B8E] dark:text-[#B9AEC9] mb-1">
                      <span>XP to Level 5</span>
                      <span className="group-hover:text-[#FF729F] transition-colors">340 / 500 ⭐</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#FAF0F5] dark:bg-[#1D1729] overflow-hidden">
                      <div className="w-[68%] h-full rounded-full bg-gradient-to-r from-[#FF98B3] to-[#FF729F] group-hover:brightness-110 transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="mt-3 pt-3 border-t border-[#F7EBF2] dark:border-[#40354F] flex items-center justify-between text-[11px] font-bold text-[#FF729F]">
                <span>Good Habits Brighter Days</span>
                <Heart className="w-3.5 h-3.5 fill-[#FF729F] group-hover:scale-125 transition-transform duration-300" />
              </div>
            </div>
          </div>

          {/* Right Column (8 cols): Fully Functional Real App Window Mockup */}
          <div className="lg:col-span-8">
            <div className="rounded-3xl border-2 border-[#F0E4DE] dark:border-[#40354F] bg-white dark:bg-[#241D33] shadow-2xl overflow-hidden transition-colors">
              {/* Window Header */}
              <div className="px-4 py-3 bg-[#FAF6F3] dark:bg-[#1D1729] border-b border-[#F0E4DE] dark:border-[#40354F] flex items-center justify-between text-xs">
                {/* Logo & Room Title */}
                <div className="flex items-center gap-3">
                  <div className="hover-lift-pill flex items-center gap-1.5 font-display font-extrabold text-[#4A3E4D] dark:text-[#F8F1FF] cursor-pointer">
                    <span className="text-sm">⭐</span>
                    <span>Focie</span>
                  </div>

                  <div className="hover-lift-pill hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#241D33] border border-[#EBE0D8] dark:border-[#40354F] rounded-full text-[#4A3E4D] dark:text-[#F8F1FF] font-bold cursor-pointer">
                    <span>🏠</span>
                    <span>Our Study Room</span>
                    <span className="text-[#FF729F]">♡</span>
                  </div>
                </div>

                {/* Friend Avatars */}
                <div className="flex items-center gap-1.5">
                  <span className="hover-lift-pill px-2.5 py-0.5 rounded-full bg-[#FFEBF0] dark:bg-[#4A263D] text-[10px] font-bold text-[#D84A6E] dark:text-[#FF729F] cursor-pointer">
                    You
                  </span>
                  <span className="hover-lift-pill px-2.5 py-0.5 rounded-full bg-[#EBF3FF] dark:bg-[#203254] text-[10px] font-bold text-[#3B7AE8] dark:text-[#8BB4FA] cursor-pointer">
                    Bestie
                  </span>
                  <span className="hover-lift-pill px-2.5 py-0.5 rounded-full bg-[#FFF8E5] dark:bg-[#45361D] text-[10px] font-bold text-[#D99B16] dark:text-[#F6D28B] cursor-pointer">
                    Aarav
                  </span>
                  <span className="hover-lift-pill px-2.5 py-0.5 rounded-full bg-[#ECF8F1] dark:bg-[#1A3826] text-[10px] font-bold text-[#2EB562] dark:text-[#91E6C1] cursor-pointer">
                    Tara
                  </span>
                </div>

                {/* Window Actions */}
                <div className="flex items-center gap-2 text-[#8C7B8E] dark:text-[#B9AEC9]">
                  <Bell className="w-4 h-4 cursor-pointer hover:text-[#4A3E4D] dark:hover:text-[#F8F1FF] transition-colors" />
                  <span className="hover-lift-pill w-6 h-6 rounded-full bg-[#FFE5EC] dark:bg-[#4A263D] flex items-center justify-center text-xs cursor-pointer">
                    🐰
                  </span>
                </div>
              </div>

              {/* Window Grid */}
              <div className="grid grid-cols-12 min-h-[380px]">
                {/* Left Navigation (2 cols) */}
                <div className="hidden md:flex md:col-span-2 bg-[#FDFBF9] dark:bg-[#171321] border-r border-[#F0E4DE] dark:border-[#40354F] p-3 flex-col gap-1 text-[11px] font-bold text-[#7D6E7E] dark:text-[#B9AEC9]">
                  <div className="hover-lift-pill flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#FFEBF0] dark:bg-[#4A263D] text-[#FF729F] cursor-pointer">
                    <Home className="w-3.5 h-3.5" />
                    <span>Home</span>
                  </div>
                  <div className="hover-lift-pill flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Study Room</span>
                  </div>
                  <div className="hover-lift-pill flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                    <Users className="w-3.5 h-3.5" />
                    <span>Friends</span>
                  </div>
                  <div className="hover-lift-pill flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Leaderboard</span>
                  </div>
                  <div className="hover-lift-pill flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                    <Gift className="w-3.5 h-3.5" />
                    <span>Gifts</span>
                  </div>
                  <div className="hover-lift-pill flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                    <Sprout className="w-3.5 h-3.5" />
                    <span>Companion</span>
                  </div>
                  <div className="hover-lift-pill flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer mt-auto">
                    <Settings className="w-3.5 h-3.5" />
                    <span>Settings</span>
                  </div>
                </div>

                {/* Center Virtual Study Room Canvas (7 cols) */}
                <div className="col-span-12 md:col-span-6 lg:col-span-7 p-4 flex flex-col justify-between bg-gradient-to-br from-[#FFF9F6] to-[#FAF4FA] dark:from-[#241D33] dark:to-[#1D1729]">
                  {/* Virtual Room Desk Header */}
                  <div className="hover-lift-sm bg-white/90 dark:bg-[#302641] rounded-2xl p-3 border border-[#F0E2EB] dark:border-[#40354F] hover:border-[#FF729F]/40 dark:hover:border-[#C5A7FF]/40 shadow-2xs hover:shadow-md cursor-pointer select-none">
                    <div className="flex items-center justify-between text-xs font-bold text-[#4A3E4D] dark:text-[#F8F1FF]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#2EB562] dark:bg-[#91E6C1] animate-pulse" />
                        <span>Room: Kawaii Library Vibe</span>
                      </div>
                      <div className="hover-lift-pill flex items-center gap-1.5 text-[10px] text-[#FF729F] font-semibold bg-[#FFEBF0] dark:bg-[#4A263D] px-2 py-0.5 rounded-full cursor-pointer">
                        <Music className="w-3.5 h-3.5" />
                        <span>Lo-Fi Beats 432Hz</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#8C7B8E] dark:text-[#B9AEC9] mt-1">
                      Everyone is in silence & deep study mode. Total group focus today: 5h 24m.
                    </p>
                  </div>

                  {/* 4 Active Member Study Stations */}
                  <div className="grid grid-cols-2 gap-2.5 my-3">
                    {/* Station 1: You */}
                    <div className="hover-lift-sm bg-white dark:bg-[#241D33] p-3 rounded-2xl border border-[#F3E2EA] dark:border-[#40354F] hover:border-[#FF729F]/60 dark:hover:border-[#FF729F]/60 shadow-2xs hover:shadow-lg hover:shadow-pink-500/10 dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5),0_0_12px_rgba(255,114,159,0.2)] cursor-pointer group select-none">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm group-hover:scale-125 group-hover:rotate-6 transition-transform duration-300">🐰</span>
                          <span className="text-xs font-extrabold text-[#4A3E4D] dark:text-[#F8F1FF] group-hover:text-[#FF729F] transition-colors">You</span>
                        </div>
                        <span className="text-[9px] font-bold text-[#2EB562] dark:text-[#91E6C1] bg-[#EAF7EE] dark:bg-[#1A3826] px-1.5 py-0.5 rounded-full group-hover:shadow-2xs transition-all">
                          Studying
                        </span>
                      </div>
                      <div className="text-[10px] text-[#8C7B8E] dark:text-[#B9AEC9] font-medium mt-1">
                        Task: Linear Algebra
                      </div>
                      <div className="font-mono text-sm font-extrabold text-[#FF729F] mt-1 group-hover:scale-105 transition-transform origin-left">
                        01:25:32
                      </div>
                    </div>

                    {/* Station 2: Bestie */}
                    <div className="hover-lift-sm bg-white dark:bg-[#241D33] p-3 rounded-2xl border border-[#E6EEF8] dark:border-[#40354F] hover:border-[#3B7AE8]/60 dark:hover:border-[#8BB4FA]/60 shadow-2xs hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5),0_0_12px_rgba(139,180,250,0.2)] cursor-pointer group select-none">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm group-hover:scale-125 group-hover:-rotate-6 transition-transform duration-300">🌸</span>
                          <span className="text-xs font-extrabold text-[#4A3E4D] dark:text-[#F8F1FF] group-hover:text-[#3B7AE8] dark:group-hover:text-[#8BB4FA] transition-colors">Bestie</span>
                        </div>
                        <span className="text-[9px] font-bold text-[#3B7AE8] dark:text-[#8BB4FA] bg-[#EAF2FF] dark:bg-[#203254] px-1.5 py-0.5 rounded-full group-hover:shadow-2xs transition-all">
                          Studying
                        </span>
                      </div>
                      <div className="text-[10px] text-[#8C7B8E] dark:text-[#B9AEC9] font-medium mt-1">
                        Task: Organic Chem
                      </div>
                      <div className="font-mono text-sm font-extrabold text-[#3B7AE8] dark:text-[#8BB4FA] mt-1 group-hover:scale-105 transition-transform origin-left">
                        00:48:10
                      </div>
                    </div>

                    {/* Station 3: Aarav */}
                    <div className="hover-lift-sm bg-white dark:bg-[#241D33] p-3 rounded-2xl border border-[#F6EFE0] dark:border-[#40354F] hover:border-[#D99B16]/60 dark:hover:border-[#F6D28B]/60 shadow-2xs hover:shadow-lg hover:shadow-amber-500/10 dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5),0_0_12px_rgba(246,210,139,0.2)] cursor-pointer group select-none">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300">🍵</span>
                          <span className="text-xs font-extrabold text-[#4A3E4D] dark:text-[#F8F1FF] group-hover:text-[#D99B16] dark:group-hover:text-[#F6D28B] transition-colors">Aarav</span>
                        </div>
                        <span className="text-[9px] font-bold text-[#D99B16] dark:text-[#F6D28B] bg-[#FFF8E5] dark:bg-[#45361D] px-1.5 py-0.5 rounded-full group-hover:shadow-2xs transition-all">
                          On Break
                        </span>
                      </div>
                      <div className="text-[10px] text-[#8C7B8E] dark:text-[#B9AEC9] font-medium mt-1">
                        Making green tea
                      </div>
                      <div className="font-mono text-sm font-extrabold text-[#8C7B8E] dark:text-[#B9AEC9] mt-1">
                        --:--:--
                      </div>
                    </div>

                    {/* Station 4: Tara */}
                    <div className="hover-lift-sm bg-white dark:bg-[#241D33] p-3 rounded-2xl border border-[#E5F3EC] dark:border-[#40354F] hover:border-[#2EB562]/60 dark:hover:border-[#91E6C1]/60 shadow-2xs hover:shadow-lg hover:shadow-emerald-500/10 dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5),0_0_12px_rgba(145,230,193,0.2)] cursor-pointer group select-none">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-300">✨</span>
                          <span className="text-xs font-extrabold text-[#4A3E4D] dark:text-[#F8F1FF] group-hover:text-[#2EB562] dark:group-hover:text-[#91E6C1] transition-colors">Tara</span>
                        </div>
                        <span className="text-[9px] font-bold text-[#2EB562] dark:text-[#91E6C1] bg-[#EAF7EE] dark:bg-[#1A3826] px-1.5 py-0.5 rounded-full group-hover:shadow-2xs transition-all">
                          Studying
                        </span>
                      </div>
                      <div className="text-[10px] text-[#8C7B8E] dark:text-[#B9AEC9] font-medium mt-1">
                        Task: History Essay
                      </div>
                      <div className="font-mono text-sm font-extrabold text-[#2EB562] dark:text-[#91E6C1] mt-1 group-hover:scale-105 transition-transform origin-left">
                        02:10:05
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Goal & Live Interactive Chat (3 cols) */}
                <div className="col-span-12 md:col-span-4 lg:col-span-3 bg-[#FAF7F4] dark:bg-[#1D1729] border-t md:border-t-0 md:border-l border-[#F0E4DE] dark:border-[#40354F] p-3 flex flex-col justify-between">
                  {/* Today's Goal Ring */}
                  <div className="hover-lift-sm bg-white dark:bg-[#241D33] border border-[#EFE5DE] dark:border-[#40354F] hover:border-[#FF729F]/50 dark:hover:border-[#FF729F]/50 rounded-2xl p-3 shadow-2xs hover:shadow-md mb-3 cursor-pointer select-none group transition-colors">
                    <div className="text-[11px] font-bold text-[#4A3E4D] dark:text-[#F8F1FF] mb-2 flex items-center justify-between">
                      <span className="group-hover:text-[#FF729F] transition-colors">Today&apos;s Goal</span>
                      <span className="group-hover:scale-125 transition-transform duration-300">🎯</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-12 h-12 transform -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="18"
                            stroke="#F2E6E0"
                            strokeWidth="4"
                            className="stroke-[#F2E6E0] dark:stroke-[#302641]"
                            fill="transparent"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="18"
                            stroke="#FF729F"
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray="113"
                            strokeDashoffset="28"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-[9px] font-extrabold text-[#4A3E4D] dark:text-[#F8F1FF]">
                          75%
                        </span>
                      </div>

                      <div>
                        <div className="text-xs font-extrabold text-[#4A3E4D] dark:text-[#F8F1FF]">
                          12h / 16h
                        </div>
                        <div className="text-[10px] text-[#D84A6E] dark:text-[#FF729F] font-semibold flex items-center gap-1">
                          Keep going! <Sparkles className="w-2.5 h-2.5 group-hover:scale-125 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Chat Box with Real Messaging */}
                  <div className="bg-white dark:bg-[#241D33] border border-[#EFE5DE] dark:border-[#40354F] rounded-2xl p-3 shadow-2xs flex-1 flex flex-col justify-between min-h-[190px]">
                    <div>
                      <div className="text-[11px] font-bold text-[#4A3E4D] dark:text-[#F8F1FF] mb-2 flex items-center justify-between">
                        <span>Live Room Chat</span>
                        <span className="w-2 h-2 rounded-full bg-[#2EB562] dark:bg-[#91E6C1] animate-pulse" />
                      </div>

                      <div className="space-y-1.5 text-[10px] max-h-36 overflow-y-auto pr-1">
                        {messages.map((msg, i) => (
                          <div key={i} className="hover-lift-pill flex items-start gap-1.5 p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors">
                            <span className="text-xs">{msg.avatar}</span>
                            <div>
                              <span className={`font-bold ${msg.color}`}>
                                {msg.sender}:{" "}
                              </span>
                              <span className="text-[#514453] dark:text-[#F8F1FF]">{msg.text}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Chat Input */}
                    <form
                      onSubmit={handleSendMessage}
                      className="mt-3 pt-2 border-t border-[#F2E8E2] dark:border-[#40354F] flex items-center gap-1.5"
                    >
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full text-[10px] px-2.5 py-1.5 bg-[#FAF7F4] dark:bg-[#171321] border border-[#EBE0D8] dark:border-[#40354F] rounded-full text-[#514453] dark:text-[#F8F1FF] placeholder:text-[#A898A8] dark:placeholder:text-[#6C5F79] focus:outline-none focus:ring-1 focus:ring-[#FF729F]"
                      />
                      <button
                        type="submit"
                        className="hover-lift-pill w-6 h-6 rounded-full bg-[#FF729F] hover:bg-[#F25577] dark:hover:bg-[#FF5D8F] text-white flex items-center justify-center text-[10px] flex-shrink-0 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 transition-all"
                        title="Send message"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
