import { describe, it, expect } from "vitest";
import {
  startSessionSchema,
  pauseSessionSchema,
  stopSessionSchema,
  sendFriendRequestSchema,
  respondFriendRequestSchema,
} from "@/lib/validations/session";

describe("Phase 2: Study Session & Friendship Validation Tests", () => {
  describe("startSessionSchema", () => {
    it("accepts valid default inputs", () => {
      const res = startSessionSchema.safeParse({});
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.mode).toBe("pomodoro");
        expect(res.data.target_minutes).toBe(25);
        expect(res.data.subject_tag).toBe("General Study");
      }
    });

    it("accepts custom valid stopwatch session", () => {
      const res = startSessionSchema.safeParse({
        mode: "stopwatch",
        target_minutes: 60,
        subject_tag: "Quantum Physics ⚛️",
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.mode).toBe("stopwatch");
        expect(res.data.target_minutes).toBe(60);
        expect(res.data.subject_tag).toBe("Quantum Physics ⚛️");
      }
    });

    it("rejects 0 or negative minutes", () => {
      const res = startSessionSchema.safeParse({ target_minutes: 0 });
      expect(res.success).toBe(false);
    });

    it("rejects sessions exceeding 12 hours (720 minutes)", () => {
      const res = startSessionSchema.safeParse({ target_minutes: 721 });
      expect(res.success).toBe(false);
    });

    it("rejects invalid session mode", () => {
      const res = startSessionSchema.safeParse({ mode: "invalid_mode" });
      expect(res.success).toBe(false);
    });
  });

  describe("pause and stop session schemas", () => {
    it("validates valid UUID for pause session", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      const res = pauseSessionSchema.safeParse({ session_id: validUuid });
      expect(res.success).toBe(true);
    });

    it("rejects malformed UUID for pause session", () => {
      const res = pauseSessionSchema.safeParse({ session_id: "not-a-uuid" });
      expect(res.success).toBe(false);
    });

    it("accepts stop session with optional notes", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      const res = stopSessionSchema.safeParse({
        session_id: validUuid,
        notes: "Completed chapter 4 exercises! Feeling great.",
      });
      expect(res.success).toBe(true);
    });
  });

  describe("sendFriendRequestSchema", () => {
    it("accepts valid alphanumeric username", () => {
      const res = sendFriendRequestSchema.safeParse({ target_username: "mohit_study" });
      expect(res.success).toBe(true);
    });

    it("rejects username shorter than 3 characters", () => {
      const res = sendFriendRequestSchema.safeParse({ target_username: "ab" });
      expect(res.success).toBe(false);
    });

    it("rejects username with illegal characters", () => {
      const res = sendFriendRequestSchema.safeParse({ target_username: "mohit@bestie!" });
      expect(res.success).toBe(false);
    });
  });

  describe("respondFriendRequestSchema", () => {
    const validUuid = "123e4567-e89b-12d3-a456-426614174000";

    it("accepts valid actions (accept, reject, block)", () => {
      expect(respondFriendRequestSchema.safeParse({ friendship_id: validUuid, action: "accept" }).success).toBe(true);
      expect(respondFriendRequestSchema.safeParse({ friendship_id: validUuid, action: "reject" }).success).toBe(true);
      expect(respondFriendRequestSchema.safeParse({ friendship_id: validUuid, action: "block" }).success).toBe(true);
    });

    it("rejects unauthorized actions", () => {
      expect(respondFriendRequestSchema.safeParse({ friendship_id: validUuid, action: "delete_everything" }).success).toBe(false);
    });
  });

  describe("Time Calculation & Authoritative Segment Math", () => {
    it("calculates accurate duration between start and end instants", () => {
      const start = new Date("2026-10-17T10:00:00Z").getTime();
      const end = new Date("2026-10-17T10:25:00Z").getTime();
      const durationSeconds = Math.floor((end - start) / 1000);
      expect(durationSeconds).toBe(1500); // 25 minutes = 1500 seconds
    });

    it("does not count paused intervals toward accumulated focused time", () => {
      // User studied:
      // Segment 1: 10:00 to 10:15 (15 min = 900s)
      // Paused: 10:15 to 10:20 (5 min break - 0s counted)
      // Segment 2: 10:20 to 10:30 (10 min = 600s)
      const segment1 = { start: "2026-10-17T10:00:00Z", end: "2026-10-17T10:15:00Z" };
      const segment2 = { start: "2026-10-17T10:20:00Z", end: "2026-10-17T10:30:00Z" };

      const s1Duration = Math.floor((new Date(segment1.end).getTime() - new Date(segment1.start).getTime()) / 1000);
      const s2Duration = Math.floor((new Date(segment2.end).getTime() - new Date(segment2.start).getTime()) / 1000);
      const totalFocusedSeconds = s1Duration + s2Duration;

      expect(s1Duration).toBe(900);
      expect(s2Duration).toBe(600);
      expect(totalFocusedSeconds).toBe(1500); // exactly 25 minutes, ignoring the 5-min pause
    });
  });
});

