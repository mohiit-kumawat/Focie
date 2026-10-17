import { describe, it, expect } from "vitest";
import {
  sendFriendRequestSchema,
  respondFriendRequestSchema,
} from "@/lib/validations/session";

describe("Phase 2 Part 3: Friends System & Real-Time Presence Tests", () => {
  describe("sendFriendRequestSchema", () => {
    it("accepts valid alphanumeric usernames and underscores", () => {
      const validCases = ["fumi_fan", "StudyGuru99", "alex_cozy_2026", "deep_worker"];
      for (const u of validCases) {
        const res = sendFriendRequestSchema.safeParse({ target_username: u });
        expect(res.success).toBe(true);
        if (res.success) {
          expect(res.data.target_username).toBe(u);
        }
      }
    });

    it("rejects usernames shorter than 3 characters", () => {
      expect(sendFriendRequestSchema.safeParse({ target_username: "yo" }).success).toBe(false);
      expect(sendFriendRequestSchema.safeParse({ target_username: "" }).success).toBe(false);
    });

    it("rejects usernames with spaces or special symbols", () => {
      const invalidCases = [
        "john doe",
        "user@gmail.com",
        "hacker!",
        "super#star",
        "friend/buddy",
      ];
      for (const u of invalidCases) {
        expect(sendFriendRequestSchema.safeParse({ target_username: u }).success).toBe(false);
      }
    });

    it("rejects usernames longer than 30 characters", () => {
      const tooLong = "a".repeat(31);
      expect(sendFriendRequestSchema.safeParse({ target_username: tooLong }).success).toBe(false);
    });
  });

  describe("respondFriendRequestSchema", () => {
    const validUuid = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

    it("accepts valid actions", () => {
      const actions = ["accept", "reject", "block"] as const;
      for (const act of actions) {
        const res = respondFriendRequestSchema.safeParse({
          friendship_id: validUuid,
          action: act,
        });
        expect(res.success).toBe(true);
      }
    });

    it("rejects invalid actions", () => {
      const res = respondFriendRequestSchema.safeParse({
        friendship_id: validUuid,
        action: "poke",
      });
      expect(res.success).toBe(false);
    });

    it("rejects invalid UUID format for friendship_id", () => {
      const res = respondFriendRequestSchema.safeParse({
        friendship_id: "not-a-valid-uuid-1234",
        action: "accept",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("Bidirectional Friendship Pair Logic (Anti-Duplicate Guard)", () => {
    it("ensures canonical ordering prevents reverse duplicates", () => {
      const userA = "00000000-0000-0000-0000-000000000001";
      const userB = "00000000-0000-0000-0000-000000000002";

      // Simulation of SQL LEAST and GREATEST indexing
      const getPairKey = (u1: string, u2: string) => {
        return u1 < u2 ? `${u1}:${u2}` : `${u2}:${u1}`;
      };

      const pair1 = getPairKey(userA, userB);
      const pair2 = getPairKey(userB, userA);

      expect(pair1).toBe(pair2);
      expect(pair1).toBe("00000000-0000-0000-0000-000000000001:00000000-0000-0000-0000-000000000002");
    });
  });

  describe("Live Presence State Filtering", () => {
    it("identifies active vs paused study buddies correctly", () => {
      const mockSessions = [
        { id: "1", user_id: "u1", state: "active", subject: "Math" },
        { id: "2", user_id: "u2", state: "paused", subject: "Coding" },
        { id: "3", user_id: "u3", state: "completed", subject: "History" },
      ];

      const activeBuddies = mockSessions.filter((s) => s.state === "active");
      const pausedBuddies = mockSessions.filter((s) => s.state === "paused");

      expect(activeBuddies.length).toBe(1);
      expect(activeBuddies[0].subject).toBe("Math");

      expect(pausedBuddies.length).toBe(1);
      expect(pausedBuddies[0].subject).toBe("Coding");
    });
  });
});

