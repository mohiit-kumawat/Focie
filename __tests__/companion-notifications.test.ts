import { describe, it, expect } from "vitest";
import {
  calculateStudyXp,
  getCompanionProgression,
  getCompanionQuote,
  isWithinQuietHours,
  COSMETICS_CATALOG,
  COMPANION_STAGES_INFO,
} from "@/lib/progression/companion";
import {
  equipCosmeticSchema,
  updateUserSettingsSchema,
  markNotificationSchema,
  createNotificationSchema,
} from "@/lib/validations/companion-notifications";
import type { UserSettings } from "@/types/database";

describe("Phase 5: Companion Progression & XP Math (FR-09)", () => {
  it("awards 0 XP for sessions under 60 seconds (anti-spam)", () => {
    expect(calculateStudyXp(0)).toBe(0);
    expect(calculateStudyXp(30)).toBe(0);
    expect(calculateStudyXp(59)).toBe(0);
  });

  it("calculates 1 XP per minute for standard intervals", () => {
    expect(calculateStudyXp(60)).toBe(1);
    expect(calculateStudyXp(600)).toBe(10); // 10 minutes
    expect(calculateStudyXp(1200)).toBe(20); // 20 minutes
  });

  it("awards +10 bonus XP for completing a 25-minute Pomodoro (1500s)", () => {
    // 25 XP base + 10 bonus = 35 XP
    expect(calculateStudyXp(1500)).toBe(35);
    expect(calculateStudyXp(1800)).toBe(40); // 30 min = 30 + 10 = 40
  });

  it("awards +30 bonus XP for completing a 60-minute Flow sprint (3600s)", () => {
    // 60 XP base + 30 bonus = 90 XP
    expect(calculateStudyXp(3600)).toBe(90);
    expect(calculateStudyXp(7200)).toBe(150); // 120 min = 120 + 30 = 150
  });

  it("resolves Level 1 (Sprout Fumi) for initial XP", () => {
    const res = getCompanionProgression(0);
    expect(res.level).toBe(1);
    expect(res.stage).toBe("sprout");
    expect(res.stageInfo.name).toBe("Sprout Fumi");
    expect(res.progressPercent).toBe(0);
    expect(res.unlockedCosmetics).toContain("default");
    expect(res.unlockedCosmetics).not.toContain("headphones");
  });

  it("resolves Level 2 (Budding Scholar) at 300 XP and unlocks headphones", () => {
    const res = getCompanionProgression(300);
    expect(res.level).toBe(2);
    expect(res.stage).toBe("seedling");
    expect(res.stageInfo.name).toBe("Budding Scholar");
    expect(res.unlockedCosmetics).toContain("headphones");
  });

  it("resolves Level 3 (Bloom Pioneer) at 1200 XP and unlocks sakura crown", () => {
    const res = getCompanionProgression(1200);
    expect(res.level).toBe(3);
    expect(res.stage).toBe("bloom");
    expect(res.unlockedCosmetics).toContain("sakura_crown");
  });

  it("resolves Level 4 (Sage Evergreen) at 3000 XP and unlocks tea cup & quill", () => {
    const res = getCompanionProgression(3000);
    expect(res.level).toBe(4);
    expect(res.stage).toBe("evergreen");
    expect(res.unlockedCosmetics).toContain("tea_cup");
    expect(res.unlockedCosmetics).toContain("quill");
  });

  it("resolves Level 5 (Celestial Master) at 6000 XP with 100% progress cap", () => {
    const res = getCompanionProgression(6500);
    expect(res.level).toBe(5);
    expect(res.stage).toBe("celestial");
    expect(res.progressPercent).toBe(100);
    expect(res.unlockedCosmetics).toContain("royal_crown");
    expect(res.unlockedCosmetics).toContain("wizard_hat");
  });
});

describe("Phase 5: Guilt-Free Companion Philosophy (FR-09)", () => {
  it("returns uplifting and gentle quotes without shaming during sleep/break", () => {
    const quote = getCompanionQuote("sleeping");
    expect(quote).toContain("Rest is essential");
    expect(quote.toLowerCase()).not.toContain("lazy");
    expect(quote.toLowerCase()).not.toContain("missed");
    expect(quote.toLowerCase()).not.toContain("streak broken");
  });

  it("returns cheering message during celebration", () => {
    const quote = getCompanionQuote("celebrating");
    expect(quote).toContain("shine");
  });
});

describe("Phase 5: Quiet Hours & Do-Not-Disturb Logic (FR-10)", () => {
  const baseSettings: Partial<UserSettings> = {
    quiet_hours_enabled: true,
    quiet_hours_start: "22:00:00",
    quiet_hours_end: "07:00:00",
  };

  it("detects overnight quiet hours correctly", () => {
    const lateNight = new Date(2026, 9, 20, 23, 30); // 23:30 (inside 22:00 to 07:00)
    expect(isWithinQuietHours(baseSettings, lateNight)).toBe(true);

    const earlyMorning = new Date(2026, 9, 20, 5, 0); // 05:00 (inside 22:00 to 07:00)
    expect(isWithinQuietHours(baseSettings, earlyMorning)).toBe(true);

    const afternoon = new Date(2026, 9, 20, 14, 0); // 14:00 (outside)
    expect(isWithinQuietHours(baseSettings, afternoon)).toBe(false);
  });

  it("returns false if quiet hours are disabled", () => {
    const disabledSettings: Partial<UserSettings> = {
      ...baseSettings,
      quiet_hours_enabled: false,
    };
    const midnight = new Date(2026, 9, 20, 23, 30);
    expect(isWithinQuietHours(disabledSettings, midnight)).toBe(false);
  });

  it("handles same-day quiet hours window", () => {
    const daySettings: Partial<UserSettings> = {
      quiet_hours_enabled: true,
      quiet_hours_start: "13:00:00",
      quiet_hours_end: "15:00:00",
    };
    const atTwoPm = new Date(2026, 9, 20, 14, 0);
    expect(isWithinQuietHours(daySettings, atTwoPm)).toBe(true);

    const atFourPm = new Date(2026, 9, 20, 16, 0);
    expect(isWithinQuietHours(daySettings, atFourPm)).toBe(false);
  });
});

describe("Phase 5: Zod Validation Schemas (FR-09 & FR-10)", () => {
  it("validates cosmetic equipping", () => {
    expect(equipCosmeticSchema.safeParse({ cosmetic_id: "headphones" }).success).toBe(true);
    expect(equipCosmeticSchema.safeParse({ cosmetic_id: "invalid_hat" }).success).toBe(false);
  });

  it("validates user privacy settings", () => {
    const valid = updateUserSettingsSchema.safeParse({
      activity_visibility: "private",
      sound_effects: false,
      quiet_hours_enabled: true,
      quiet_hours_start: "21:30",
      quiet_hours_end: "06:45",
      reduced_motion: true,
    });
    expect(valid.success).toBe(true);

    const invalid = updateUserSettingsSchema.safeParse({
      activity_visibility: "secret", // invalid enum
    });
    expect(invalid.success).toBe(false);
  });

  it("validates notification mark and create schemas", () => {
    expect(
      markNotificationSchema.safeParse({ notification_id: "123e4567-e89b-12d3-a456-426614174000" }).success
    ).toBe(true);
    expect(markNotificationSchema.safeParse({ notification_id: "not-a-uuid" }).success).toBe(false);

    const validNote = createNotificationSchema.safeParse({
      user_id: "123e4567-e89b-12d3-a456-426614174000",
      type: "gift_received",
      title: "Cozy Matcha Latte Received! 🍵",
      message: "Sakura sent you a warm cup of ceremonial matcha tea.",
      data: { gift_id: "matcha_latte" },
    });
    expect(validNote.success).toBe(true);
  });
});

