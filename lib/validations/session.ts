import { z } from "zod";

export const sessionModeSchema = z.enum(["pomodoro", "stopwatch"]);

export const startSessionSchema = z.object({
  mode: sessionModeSchema.default("pomodoro"),
  target_minutes: z
    .number()
    .int()
    .min(1, "Session must be at least 1 minute")
    .max(720, "Session cannot exceed 12 hours (720 minutes)")
    .default(25),
  subject_tag: z
    .string()
    .trim()
    .min(1, "Subject tag cannot be empty")
    .max(50, "Subject tag cannot exceed 50 characters")
    .default("General Study"),
});

export const pauseSessionSchema = z.object({
  session_id: z.string().uuid("Invalid session ID format"),
});

export const resumeSessionSchema = z.object({
  session_id: z.string().uuid("Invalid session ID format"),
});

export const stopSessionSchema = z.object({
  session_id: z.string().uuid("Invalid session ID format"),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
});

export const sendFriendRequestSchema = z.object({
  target_username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
});

export const respondFriendRequestSchema = z.object({
  friendship_id: z.string().uuid("Invalid friendship ID format"),
  action: z.enum(["accept", "reject", "block"]),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type PauseSessionInput = z.infer<typeof pauseSessionSchema>;
export type ResumeSessionInput = z.infer<typeof resumeSessionSchema>;
export type StopSessionInput = z.infer<typeof stopSessionSchema>;
export type SendFriendRequestInput = z.infer<typeof sendFriendRequestSchema>;
export type RespondFriendRequestInput = z.infer<typeof respondFriendRequestSchema>;

