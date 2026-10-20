import type {
  CompanionStage,
  CompanionCosmetic,
  UserSettings,
} from "@/types/database";

export interface CompanionStageInfo {
  stage: CompanionStage;
  name: string;
  minLevel: number;
  emoji: string;
  description: string;
}

export const COMPANION_STAGES_INFO: CompanionStageInfo[] = [
  {
    stage: "sprout",
    name: "Sprout Fumi",
    minLevel: 1,
    emoji: "🌱",
    description: "A tender focus seed beginning its study journey.",
  },
  {
    stage: "seedling",
    name: "Budding Scholar",
    minLevel: 2,
    emoji: "🌿",
    description: "Developing consistent study habits and steady roots.",
  },
  {
    stage: "bloom",
    name: "Bloom Pioneer",
    minLevel: 3,
    emoji: "🌸",
    description: "Petals radiant with disciplined, joyful knowledge.",
  },
  {
    stage: "evergreen",
    name: "Sage Evergreen",
    minLevel: 4,
    emoji: "🌲",
    description: "Deep wisdom and endurance through all study storms.",
  },
  {
    stage: "celestial",
    name: "Celestial Master",
    minLevel: 5,
    emoji: "👑",
    description: "Legendary focus guardian of peace and wisdom.",
  },
];

export interface CosmeticMetadata {
  id: CompanionCosmetic;
  name: string;
  emoji: string;
  minLevel: number;
  description: string;
  category: "headwear" | "accessory" | "special";
}

export const COSMETICS_CATALOG: CosmeticMetadata[] = [
  {
    id: "default",
    name: "Classic Fumi",
    emoji: "✨",
    minLevel: 1,
    description: "Pure, natural soft pastel Fumi.",
    category: "special",
  },
  {
    id: "headphones",
    name: "Lavender Headphones",
    emoji: "🎧",
    minLevel: 2,
    description: "Immersion acoustics tuned for binaural flow.",
    category: "headwear",
  },
  {
    id: "sakura_crown",
    name: "Cherry Blossom Wreath",
    emoji: "🌸",
    minLevel: 3,
    description: "Woven spring petals blessing your daily growth.",
    category: "headwear",
  },
  {
    id: "tea_cup",
    name: "Cozy Matcha Mug",
    emoji: "🍵",
    minLevel: 3,
    description: "A warm cup of calming ceremonial green tea.",
    category: "accessory",
  },
  {
    id: "quill",
    name: "Pastel Study Desk & Quill",
    emoji: "🪶",
    minLevel: 4,
    description: "Cozy walnut desk for writing notes and spells.",
    category: "accessory",
  },
  {
    id: "wizard_hat",
    name: "Night Owl Wizard Hat",
    emoji: "🧙‍♂️",
    minLevel: 4,
    description: "Starlit brim for deep late-night coding spells.",
    category: "headwear",
  },
  {
    id: "royal_crown",
    name: "Golden Fumi Crown",
    emoji: "👑",
    minLevel: 5,
    description: "Mastery tiara shimmering with golden light.",
    category: "headwear",
  },
];

// Level XP thresholds
const LEVEL_XP_THRESHOLDS = [0, 300, 1200, 3000, 6000];

/**
 * Calculates XP earned for a completed or ongoing focus session.
 * Standard: 1 XP per minute (60s).
 * Bonus: +10 XP for 25m Pomodoro, +30 XP for 60m Flow.
 */
export function calculateStudyXp(focusedSeconds: number): number {
  if (focusedSeconds < 60) return 0;
  const baseMinutesXp = Math.floor(focusedSeconds / 60);
  let bonus = 0;
  if (focusedSeconds >= 3600) {
    bonus = 30;
  } else if (focusedSeconds >= 1500) {
    bonus = 10;
  }
  return baseMinutesXp + bonus;
}

export interface ProgressionResult {
  level: number;
  stage: CompanionStage;
  stageInfo: CompanionStageInfo;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  unlockedCosmetics: CompanionCosmetic[];
}

/**
 * Resolves current level, stage, and unlocked cosmetics from total accumulated XP.
 */
export function getCompanionProgression(totalXp: number): ProgressionResult {
  const safeXp = Math.max(0, Math.floor(totalXp));

  let level = 1;
  if (safeXp >= LEVEL_XP_THRESHOLDS[4]) {
    level = 5;
  } else if (safeXp >= LEVEL_XP_THRESHOLDS[3]) {
    level = 4;
  } else if (safeXp >= LEVEL_XP_THRESHOLDS[2]) {
    level = 3;
  } else if (safeXp >= LEVEL_XP_THRESHOLDS[1]) {
    level = 2;
  } else {
    level = 1;
  }

  const stageIndex = Math.min(level - 1, COMPANION_STAGES_INFO.length - 1);
  const stageInfo = COMPANION_STAGES_INFO[stageIndex];
  const stage = stageInfo.stage;

  const currentThreshold = LEVEL_XP_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_XP_THRESHOLDS[level] ?? currentThreshold * 1.5;
  const xpInLevel = safeXp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;

  const progressPercent =
    level >= 5 ? 100 : Math.min(100, Math.floor((xpInLevel / xpNeeded) * 100));

  const unlockedCosmetics = COSMETICS_CATALOG.filter(
    (c) => c.minLevel <= level
  ).map((c) => c.id);

  return {
    level,
    stage,
    stageInfo,
    currentLevelXp: safeXp,
    nextLevelXp: nextThreshold,
    progressPercent,
    unlockedCosmetics,
  };
}

/**
 * Spec FR-09: Rest and missed goals do NOT trigger guilt-based messages.
 * Fumi provides unconditional warmth, gentle encouragement, and celebrates rest!
 */
export function getCompanionQuote(
  state: "idle" | "studying" | "sleeping" | "celebrating",
  timeRemainingStr?: string
): string {
  switch (state) {
    case "studying":
      return timeRemainingStr
        ? `In the zone! ${timeRemainingStr} of pure magic left! 🌸`
        : "Steady and gentle... you're doing amazing! 🌸";
    case "sleeping":
      return "Rest is essential for your brilliant mind! Hydrate and recharge, bestie! 🍵";
    case "celebrating":
      return "Look at you shine! Fumi is dancing with joy for you! 💖✨";
    case "idle":
    default:
      return "Whenever you're ready, Fumi is right here by your side! 🌟";
  }
}

/**
 * Spec FR-10: Checks whether the current time falls inside the user's Quiet Hours window.
 */
export function isWithinQuietHours(
  settings: Partial<UserSettings> | null,
  now: Date = new Date()
): boolean {
  if (!settings?.quiet_hours_enabled) return false;

  const startStr = settings.quiet_hours_start || "22:00:00";
  const endStr = settings.quiet_hours_end || "07:00:00";

  const [sH, sM] = startStr.split(":").map(Number);
  const [eH, eM] = endStr.split(":").map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = sH * 60 + sM;
  const endMinutes = eH * 60 + eM;

  if (startMinutes <= endMinutes) {
    // Window on the same day (e.g. 13:00 to 17:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Window crosses midnight (e.g. 22:00 to 07:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}
