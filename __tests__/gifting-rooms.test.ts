import { describe, it, expect } from "vitest";
import {
  sendGiftSchema,
  createRoomSchema,
  joinRoomSchema,
  sendRoomMessageSchema,
} from "@/lib/validations/gifting-rooms";

describe("Phase 4: Gifting & Study Rooms Validation Suite (FR-07 & FR-08)", () => {
  describe("1. sendGiftSchema Validation", () => {
    const validGift = {
      recipient_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      gift_id: "matcha_latte",
      note: "Keep up the great study focus! 🍵",
      idempotency_key: "tx_12345678_uuid",
    };

    it("accepts a valid gift sending payload", () => {
      const res = sendGiftSchema.safeParse(validGift);
      expect(res.success).toBe(true);
    });

    it("rejects invalid recipient UUIDs", () => {
      const res = sendGiftSchema.safeParse({ ...validGift, recipient_id: "not-a-uuid" });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0]?.message).toMatch(/Invalid recipient ID/i);
      }
    });

    it("rejects notes longer than 140 characters", () => {
      const longNote = "a".repeat(141);
      const res = sendGiftSchema.safeParse({ ...validGift, note: longNote });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0]?.message).toMatch(/140 characters/i);
      }
    });

    it("requires a non-empty idempotency key for double-spend protection", () => {
      const res = sendGiftSchema.safeParse({ ...validGift, idempotency_key: "" });
      expect(res.success).toBe(false);
    });

    it("permits null or omitted notes", () => {
      const res = sendGiftSchema.safeParse({
        recipient_id: validGift.recipient_id,
        gift_id: validGift.gift_id,
        idempotency_key: validGift.idempotency_key,
      });
      expect(res.success).toBe(true);
    });
  });

  describe("2. createRoomSchema Validation", () => {
    it("accepts valid room names and descriptions", () => {
      const res = createRoomSchema.safeParse({
        name: "Late Night LeetCoders 🌙",
        description: "Cozy quiet room for algorithm practice.",
        is_private: true,
      });
      expect(res.success).toBe(true);
    });

    it("rejects room names with fewer than 3 characters", () => {
      const res = createRoomSchema.safeParse({ name: "ab" });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0]?.message).toMatch(/at least 3 characters/i);
      }
    });

    it("rejects room names longer than 60 characters", () => {
      const res = createRoomSchema.safeParse({ name: "x".repeat(61) });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0]?.message).toMatch(/cannot exceed 60 characters/i);
      }
    });

    it("rejects descriptions exceeding 200 characters", () => {
      const res = createRoomSchema.safeParse({
        name: "Valid Room",
        description: "d".repeat(201),
      });
      expect(res.success).toBe(false);
    });
  });

  describe("3. joinRoomSchema & sendRoomMessageSchema", () => {
    it("accepts valid 8-character invite codes", () => {
      const res = joinRoomSchema.safeParse({ invite_code: "K7X9PQ2M" });
      expect(res.success).toBe(true);
    });

    it("rejects short or empty invite codes", () => {
      const res = joinRoomSchema.safeParse({ invite_code: "12" });
      expect(res.success).toBe(false);
    });

    it("accepts valid chat messages within 500 characters", () => {
      const res = sendRoomMessageSchema.safeParse({
        room_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        content: "Let's finish this 50-minute block together! 🌸",
      });
      expect(res.success).toBe(true);
    });

    it("rejects empty or whitespace-only messages", () => {
      const res = sendRoomMessageSchema.safeParse({
        room_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        content: "     ",
      });
      expect(res.success).toBe(false);
    });

    it("rejects messages exceeding 500 characters", () => {
      const res = sendRoomMessageSchema.safeParse({
        room_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        content: "m".repeat(501),
      });
      expect(res.success).toBe(false);
    });
  });

  describe("4. Virtual Coin Award Math (FR-07)", () => {
    function calculateEarnedCoins(seconds: number): number {
      if (seconds < 150) return 0;
      const base = Math.floor(seconds / 150);
      const bonus = seconds >= 1500 ? 2 : 0;
      return Math.min(50, base + bonus);
    }

    it("awards 0 coins for sessions under 2.5 minutes", () => {
      expect(calculateEarnedCoins(100)).toBe(0);
      expect(calculateEarnedCoins(149)).toBe(0);
    });

    it("awards 12 coins for a completed 25-minute Pomodoro (1500s)", () => {
      // 1500 / 150 = 10 base + 2 bonus = 12 coins
      expect(calculateEarnedCoins(1500)).toBe(12);
    });

    it("awards 26 coins for an uninterrupted 60-minute Flow session (3600s)", () => {
      // 3600 / 150 = 24 base + 2 bonus = 26 coins
      expect(calculateEarnedCoins(3600)).toBe(26);
    });

    it("caps maximum single-session coin earnings at 50 coins", () => {
      // 10 hours continuous = 36000s
      expect(calculateEarnedCoins(36000)).toBe(50);
    });
  });
});

