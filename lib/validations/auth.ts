import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(24, "Username must be at most 24 characters")
  .regex(
    /^[a-z0-9_]+$/,
    "Username can only contain lowercase letters, numbers, and underscores"
  );

export const profileUpdateSchema = z.object({
  display_name: z.string().trim().min(1).max(50).optional(),
  avatar_url: z.string().url().optional().nullable(),
  timezone: z.string().min(1).default("Asia/Kolkata"),
});

export const studyDaySettingsSchema = z.object({
  timezone: z.string().min(1),
  day_start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM format (24-hour)"),
});
