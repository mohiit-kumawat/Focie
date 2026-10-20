import { z } from "zod";

export const sendGiftSchema = z.object({
  recipient_id: z.string().uuid("Invalid recipient ID"),
  gift_id: z.string().min(2, "Invalid gift ID").max(40),
  note: z.string().max(140, "Note cannot exceed 140 characters").optional().nullable(),
  idempotency_key: z.string().min(8, "Idempotency key required"),
});

export type SendGiftInput = z.infer<typeof sendGiftSchema>;

export const createRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Room name must be at least 3 characters")
    .max(50, "Room name cannot exceed 50 characters"),
  description: z.string().trim().max(200, "Description cannot exceed 200 characters").optional().nullable(),
  is_private: z.boolean().default(false),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const joinRoomSchema = z.object({
  invite_code: z.string().trim().min(4, "Invalid invite code").max(20),
});

export type JoinRoomInput = z.infer<typeof joinRoomSchema>;

export const sendRoomMessageSchema = z.object({
  room_id: z.string().uuid("Invalid room ID"),
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(500, "Message cannot exceed 500 characters"),
});

export type SendRoomMessageInput = z.infer<typeof sendRoomMessageSchema>;

