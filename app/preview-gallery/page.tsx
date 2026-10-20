"use client";

import React, { useState } from "react";
import { LeaderboardWidget } from "@/components/dashboard/LeaderboardWidget";
import { GiftingShopWidget } from "@/components/dashboard/GiftingShopWidget";
import { StudyRoomsWidget } from "@/components/dashboard/StudyRoomsWidget";
import { FumiCompanionWidget } from "@/components/dashboard/FumiCompanionWidget";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { SettingsModal } from "@/components/dashboard/SettingsModal";
import { Card } from "@/components/ui/Card";
import { Clock, Globe, ShieldCheck, Edit2, Settings, Bell } from "lucide-react";
import type { LeaderboardResult } from "@/app/actions/leaderboard";
import type { GiftItem, UserWallet, Notification, UserSettings } from "@/types/database";
import type { RoomWithDetails, ChatMessageWithSender } from "@/app/actions/rooms";
import type { CompanionResult } from "@/app/actions/companion";

const MOCK_LEADERBOARD: LeaderboardResult = {
  success: true,
  mode: "personal_day",
  userWindow: {
    windowStart: new Date("2026-10-20T00:30:00.000Z"),
    windowEnd: new Date("2026-10-21T00:30:00.000Z"),
    timezone: "Asia/Kolkata",
    dayStartTime: "06:00:00",
    isCurrentDay: true,
    label: "Today (Oct 20, 06:00 local)",
    remainingSeconds: 58400,
  },
  rankings: [
    {
      userId: "u-1",
      username: "mohit",
      displayName: "Mohit Kumawat",
      avatarUrl: "/images/mascot/fumi-celebrating.webp?v=2",
      focusedSeconds: 13500, // 3h 45m
      formattedTime: "3h 45m",
      rank: 1,
      isCurrentUser: true,
      isStudyingNow: true,
      currentSubject: "Coding 💻",
    },
    {
      userId: "u-2",
      username: "sakura",
      displayName: "Sakura Tanaka",
      avatarUrl: "/images/mascot/fumi-headphones.webp?v=2",
      focusedSeconds: 9000, // 2h 30m
      formattedTime: "2h 30m",
      rank: 2,
      isCurrentUser: false,
      isStudyingNow: true,
      currentSubject: "Deep Work ⚡",
    },
    {
      userId: "u-3",
      username: "kenji",
      displayName: "Kenji Sato",
      avatarUrl: "/images/mascot/fumi-idle.webp?v=2",
      focusedSeconds: 6300, // 1h 45m
      formattedTime: "1h 45m",
      rank: 3,
      isCurrentUser: false,
      isStudyingNow: false,
      currentSubject: "Mathematics 📐",
    },
    {
      userId: "u-4",
      username: "aoi",
      displayName: "Aoi Takahashi",
      avatarUrl: "/images/mascot/fumi-studying.webp?v=2",
      focusedSeconds: 3000, // 50m
      formattedTime: "50m",
      rank: 4,
      isCurrentUser: false,
      isStudyingNow: false,
      currentSubject: "Reading 📖",
    },
  ],
  myRank: 1,
  totalParticipants: 4,
};

const MOCK_WALLET: UserWallet = {
  id: "w-1",
  user_id: "u-1",
  balance: 120,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const MOCK_CATALOG: GiftItem[] = [
  { id: "matcha_latte", name: "Matcha Latte", emoji: "🍵", description: "Calming ceremonial green tea.", coin_price: 15, is_active: true, created_at: "" },
  { id: "blossom_sprout", name: "Cherry Sprout", emoji: "🌸", description: "Petal blessing for steady growth.", coin_price: 25, is_active: true, created_at: "" },
  { id: "strawberry_cake", name: "Shortcake", emoji: "🍰", description: "Sweet focus sprint reward.", coin_price: 40, is_active: true, created_at: "" },
  { id: "sparkling_star", name: "Focus Star", emoji: "⭐", description: "Pure luminous energy for study nights.", coin_price: 60, is_active: true, created_at: "" },
  { id: "royal_crown", name: "Royal Crown", emoji: "👑", description: "Ultimate badge for focus champions.", coin_price: 100, is_active: true, created_at: "" },
];

const MOCK_FRIENDS = [
  { id: "u-2", name: "Sakura Tanaka", username: "sakura", avatarUrl: "/images/mascot/fumi-headphones.webp?v=2" },
  { id: "u-3", name: "Kenji Sato", username: "kenji", avatarUrl: "/images/mascot/fumi-idle.webp?v=2" },
];

const MOCK_ROOM: RoomWithDetails = {
  id: "room-1",
  owner_id: "u-1",
  name: "Late Night LeetCoders 🌙",
  description: "Cozy quiet circle for algorithms & coffee.",
  is_private: true,
  invite_code: "K7X9PQ2M",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  memberCount: 3,
  isOwner: true,
  members: [
    { userId: "u-1", username: "mohit", displayName: "Mohit", avatarUrl: "/images/mascot/fumi-celebrating.webp?v=2", role: "owner", isStudyingNow: true, currentSubject: "Coding 💻" },
    { userId: "u-2", username: "sakura", displayName: "Sakura", avatarUrl: "/images/mascot/fumi-headphones.webp?v=2", role: "member", isStudyingNow: true, currentSubject: "Deep Work ⚡" },
    { userId: "u-3", username: "kenji", displayName: "Kenji", avatarUrl: "/images/mascot/fumi-idle.webp?v=2", role: "member", isStudyingNow: false },
  ],
};

const MOCK_MESSAGES: ChatMessageWithSender[] = [
  {
    id: "m-1",
    room_id: "room-1",
    sender_id: "u-1",
    content: "Starting 50m LeetCode graph problem sprint! 💻",
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    senderName: "Mohit",
    senderAvatar: "/images/mascot/fumi-celebrating.webp?v=2",
    isCurrentUser: true,
  },
  {
    id: "m-2",
    room_id: "room-1",
    sender_id: "u-2",
    content: "Let's go bestie! Cheering for you! 🌸",
    created_at: new Date(Date.now() - 12 * 60000).toISOString(),
    senderName: "Sakura",
    senderAvatar: "/images/mascot/fumi-headphones.webp?v=2",
    isCurrentUser: false,
  },
  {
    id: "m-3",
    room_id: "room-1",
    sender_id: "u-3",
    content: "🍵 Taking a quick tea break, then joining!",
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    senderName: "Kenji",
    senderAvatar: "/images/mascot/fumi-idle.webp?v=2",
    isCurrentUser: false,
  },
  {
    id: "m-4",
    room_id: "room-1",
    sender_id: "u-1",
    content: "✨ Let's crush this session together!",
    created_at: new Date(Date.now() - 1 * 60000).toISOString(),
    senderName: "Mohit",
    senderAvatar: "/images/mascot/fumi-celebrating.webp?v=2",
    isCurrentUser: true,
  },
];

const MOCK_COMPANION: CompanionResult = {
  success: true,
  profile: {
    id: "comp-1",
    user_id: "u-1",
    level: 3,
    xp: 1450,
    current_stage: "bloom",
    equipped_cosmetic: "headphones",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  progression: {
    level: 3,
    stage: "bloom",
    stageInfo: {
      stage: "bloom",
      name: "Bloom Pioneer",
      minLevel: 3,
      emoji: "🌸",
      description: "Petals radiant with disciplined, joyful knowledge.",
    },
    currentLevelXp: 1450,
    nextLevelXp: 3000,
    progressPercent: 48,
    unlockedCosmetics: ["default", "headphones", "sakura_crown", "tea_cup"],
  },
  unlockedList: ["default", "headphones", "sakura_crown", "tea_cup"],
};

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    user_id: "u-1",
    type: "gift_received",
    title: "Cozy Matcha Latte Received! 🍵",
    message: "Sakura sent you a warm cup of ceremonial matcha tea: 'Crush your sprint!'",
    data: { gift_id: "matcha_latte" },
    is_read: false,
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "notif-2",
    user_id: "u-1",
    type: "level_up",
    title: "🎉 Fumi Reached Level 3 (Bloom Pioneer)!",
    message: "Congratulations! You unlocked the Cherry Blossom Wreath and Cozy Matcha Mug.",
    data: { level: 3, stage: "bloom" },
    is_read: false,
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: "notif-3",
    user_id: "u-1",
    type: "friend_accepted",
    title: "🌸 Kenji Sato Accepted Your Buddy Request!",
    message: "You can now study together and climb the shared challenge leaderboards.",
    data: {},
    is_read: true,
    created_at: new Date(Date.now() - 120 * 60000).toISOString(),
  },
];

const MOCK_SETTINGS: UserSettings = {
  id: "s-1",
  user_id: "u-1",
  sound_effects: true,
  activity_visibility: "friends",
  quiet_hours_enabled: true,
  quiet_hours_start: "22:00:00",
  quiet_hours_end: "07:00:00",
  reduced_motion: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function PreviewGalleryPage() {
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#171321] text-[#F8F1FF] p-10 space-y-16 max-w-[1200px] mx-auto">
      {/* Target 1: Phase 3 Leaderboard (Full Widget with Podium & Standings) */}
      <section id="section-phase3-leaderboard" className="w-full max-w-[850px] mx-auto bg-[#171321] p-4 rounded-3xl">
        <LeaderboardWidget initialData={MOCK_LEADERBOARD} previewMode={true} />
      </section>

      {/* Target 2: Phase 3 Schedule Card (24-Hour Day Setting) */}
      <section id="section-phase3-schedule" className="w-full max-w-[460px] mx-auto bg-[#171321] p-4 rounded-3xl">
        <Card variant="cream" className="flex flex-col justify-between hover:border-[#FF729F]/40 transition-all p-6 bg-[#241D33] border-[#352B46] text-[#F8F1FF]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-2xl bg-[#302641] w-fit text-[#FF729F]">
                <Clock className="w-5 h-5" />
              </div>
              <button className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#FF729F] bg-[#302641] flex items-center gap-1.5 border border-[#FF729F]/20">
                <Edit2 className="w-3.5 h-3.5" />
                <span>Change</span>
              </button>
            </div>
            <h3 className="font-bold text-lg text-[#F8F1FF]">24-Hour Study Day</h3>
            <p className="text-xs text-[#B9AEC9]">Your day resets daily at:</p>
            <p className="text-3xl font-black text-[#FF729F] tracking-tight">06:00 AM</p>
            <p className="text-xs text-[#8C7B8E] leading-relaxed">
              Late-night study sessions before this time count toward the previous day!
            </p>
            <p className="text-xs font-bold text-[#91E6C1]">✓ Timezone: Asia/Kolkata (IST)</p>
          </div>
        </Card>
      </section>

      {/* Target 3: Phase 4 Gift Shop */}
      <section id="section-phase4-gift-shop" className="w-full max-w-[650px] mx-auto bg-[#171321] p-4 rounded-3xl">
        <GiftingShopWidget
          friends={MOCK_FRIENDS}
          initialWallet={MOCK_WALLET}
          initialCatalog={MOCK_CATALOG}
          initialSelectedGift={MOCK_CATALOG[0]}
          initialSelectedFriendId="u-2"
          initialNote="Good luck on your deep work sprint! 🌸"
          previewMode={true}
        />
      </section>

      {/* Target 4: Phase 4 Study Rooms */}
      <section id="section-phase4-study-room" className="w-full max-w-[650px] mx-auto bg-[#171321] p-4 rounded-3xl">
        <StudyRoomsWidget
          initialRooms={[MOCK_ROOM]}
          initialActiveRoom={MOCK_ROOM}
          initialMessages={MOCK_MESSAGES}
          previewMode={true}
        />
      </section>

      {/* Target 5: Phase 5 Fumi Companion & Progression Wardrobe (FR-09) */}
      <section id="section-phase5-companion" className="w-full max-w-[750px] mx-auto bg-[#171321] p-4 rounded-3xl">
        <FumiCompanionWidget
          initialCompanion={MOCK_COMPANION}
          activeSessionState="idle"
          previewMode={true}
        />
      </section>

      {/* Target 6: Phase 5 Notification Center (FR-10) */}
      <section id="section-phase5-notifications" className="w-full max-w-[420px] mx-auto bg-[#171321] p-6 rounded-3xl pb-96">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-[#A49AAB]">Top Navigation Notification Menu:</span>
          <div className="flex items-center gap-3">
            <NotificationCenter
              initialNotifications={MOCK_NOTIFICATIONS}
              initialUnreadCount={2}
              forceOpen={true}
              previewMode={true}
            />
          </div>
        </div>
      </section>

      {/* Target 7: Phase 5 Preferences & Privacy Settings (FR-10) */}
      <section id="section-phase5-settings" className="w-full max-w-[540px] mx-auto bg-[#171321] p-6 rounded-3xl">
        <SettingsModal
          isOpen={true}
          onClose={() => {}}
          initialSettings={MOCK_SETTINGS}
          previewMode={true}
          inline={true}
        />
      </section>
    </div>
  );
}
