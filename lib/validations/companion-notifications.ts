import { z } from "zod";

export const COMPANION_COSMETICS = [
  "default",
  "headphones",
  "quill",
  "tea_cup",
  "sakura_crown",
  "royal_crown",
  "wizard_hat",
] as const;

export const COMPANION_STAGES = [
  "sprout",
  "seedling",
  "bloom",
  "evergreen",
  "celestial",
] as const;

export const NOTIFICATION_TYPES = [
  "gift_received",
  "friend_request",
  "friend_accepted",
  "milestone_unlocked",
  "room_invite",
  "level_up",
] as const;

export const equipCosmeticSchema = z.object({
  cosmetic_id: z.enum(COMPANION_COSMETICS, {
    message: "Invalid cosmetic item selected",
  }),
});

export const updateUserSettingsSchema = z.object({
  sound_effects: z.boolean().optional(),
  activity_visibility: z.enum(["public", "friends", "private"]).optional(),
  quiet_hours_enabled: z.boolean().optional(),
  quiet_hours_start: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "Invalid start time format (HH:MM)")
    .optional(),
  quiet_hours_end: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "Invalid end time format (HH:MM)")
    .optional(),
  reduced_motion: z.boolean().optional(),
});

export const markNotificationSchema = z.object({
  notification_id: z.string().uuid("Invalid notification ID"),
});

export const createNotificationSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  type: z.enum(NOTIFICATION_TYPES),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(300),
  data: z.record(z.string(), z.any()).optional(),
});

export type EquipCosmeticInput = z.infer<typeof equipCosmeticSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
export type MarkNotificationInput = z.infer<typeof markNotificationSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

