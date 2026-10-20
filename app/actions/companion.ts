"use server";

import { createClient } from "@/lib/supabase/server";
import { equipCosmeticSchema } from "@/lib/validations/companion-notifications";
import {
  getCompanionProgression,
  calculateStudyXp,
  type ProgressionResult,
} from "@/lib/progression/companion";
import type {
  CompanionProfile,
  CompanionCosmetic,
} from "@/types/database";

export interface CompanionResult {
  success: boolean;
  profile?: CompanionProfile;
  progression?: ProgressionResult;
  unlockedList?: CompanionCosmetic[];
  error?: string;
}

export async function getCompanionProfile(): Promise<CompanionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  // 1. Fetch companion profile or initialize default
  let { data: profile } = await supabase
    .from("companion_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    const { data: newProfile, error: initError } = await supabase
      .from("companion_profiles")
      .insert({
        user_id: user.id,
        level: 1,
        xp: 0,
        current_stage: "sprout",
        equipped_cosmetic: "default",
      })
      .select()
      .single();

    if (initError || !newProfile) {
      return { success: false, error: "Failed to initialize companion profile" };
    }
    profile = newProfile;
  }

  // 2. Resolve progression based on XP
  const progression = getCompanionProgression(profile.xp);

  // Auto-upgrade stage if XP exceeded
  if (profile.level !== progression.level || profile.current_stage !== progression.stage) {
    await supabase
      .from("companion_profiles")
      .update({
        level: progression.level,
        current_stage: progression.stage,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    profile.level = progression.level;
    profile.current_stage = progression.stage;
  }

  // 3. Fetch user cosmetics
  const { data: userCosmetics } = await supabase
    .from("user_cosmetics")
    .select("cosmetic_id")
    .eq("user_id", user.id);

  const inventorySet = new Set<CompanionCosmetic>([
    "default",
    ...progression.unlockedCosmetics,
    ...(userCosmetics?.map((c) => c.cosmetic_id as CompanionCosmetic) || []),
  ]);

  return {
    success: true,
    profile,
    progression,
    unlockedList: Array.from(inventorySet),
  };
}

export async function equipCosmetic(cosmeticId: string): Promise<CompanionResult> {
  const parsed = equipCosmeticSchema.safeParse({ cosmetic_id: cosmeticId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  // Check if user has unlocked this cosmetic
  const comp = await getCompanionProfile();
  if (!comp.success || !comp.unlockedList) {
    return { success: false, error: "Could not verify cosmetics inventory" };
  }

  if (!comp.unlockedList.includes(parsed.data.cosmetic_id)) {
    return { success: false, error: "Cosmetic is not yet unlocked at your current level" };
  }

  const { data: updated, error } = await supabase
    .from("companion_profiles")
    .update({
      equipped_cosmetic: parsed.data.cosmetic_id,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !updated) {
    return { success: false, error: "Failed to equip cosmetic item" };
  }

  return {
    success: true,
    profile: updated,
    progression: comp.progression,
    unlockedList: comp.unlockedList,
  };
}

export async function awardFocusSessionXp(focusedSeconds: number): Promise<{
  success: boolean;
  xpEarned: number;
  newTotalXp?: number;
  leveledUp?: boolean;
  newLevel?: number;
  error?: string;
}> {
  const xpEarned = calculateStudyXp(focusedSeconds);
  if (xpEarned <= 0) return { success: true, xpEarned: 0 };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, xpEarned: 0, error: "Authentication required" };

  const comp = await getCompanionProfile();
  if (!comp.success || !comp.profile) {
    return { success: false, xpEarned: 0, error: "Companion profile missing" };
  }

  const oldLevel = comp.profile.level;
  const newTotalXp = comp.profile.xp + xpEarned;
  const newProgression = getCompanionProgression(newTotalXp);

  await supabase
    .from("companion_profiles")
    .update({
      xp: newTotalXp,
      level: newProgression.level,
      current_stage: newProgression.stage,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  const leveledUp = newProgression.level > oldLevel;

  if (leveledUp) {
    // Insert in-app celebration notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "level_up",
      title: `🎉 Fumi Leveled Up to Level ${newProgression.level}!`,
      message: `Your companion evolved into ${newProgression.stageInfo.name}! New cosmetics unlocked.`,
      data: { level: newProgression.level, stage: newProgression.stage },
    });
  }

  return {
    success: true,
    xpEarned,
    newTotalXp,
    leveledUp,
    newLevel: newProgression.level,
  };
}

