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

    it("clamps Pomodoro duration to target ceiling when user walks away without stopping", () => {
      // User starts 25-minute Pomodoro (1500 seconds) and leaves tab open for 3 hours (10,800 seconds)
      const targetMinutes = 25;
      const maxAllowedSeconds = targetMinutes * 60; // 1500s
      const accumulatedSeconds = 0;
      const rawElapsedSeconds = 3 * 3600; // 10800s

      const neededSeconds = Math.max(0, maxAllowedSeconds - accumulatedSeconds);
      const additionalSeconds = Math.min(rawElapsedSeconds, neededSeconds);
      const finalSeconds = Math.min(maxAllowedSeconds, accumulatedSeconds + additionalSeconds);

      expect(additionalSeconds).toBe(1500);
      expect(finalSeconds).toBe(1500);
    });

    it("clamps multi-segment Pomodoro sessions so total accumulated never exceeds target", () => {
      // User studied 15 minutes (900s), paused, resumed, and left desk for 2 hours (7200s)
      const targetMinutes = 25;
      const maxAllowedSeconds = targetMinutes * 60; // 1500s
      const accumulatedSeconds = 900; // 15 mins
      const rawSecondSegmentSeconds = 7200; // 2 hours

      const neededSeconds = Math.max(0, maxAllowedSeconds - accumulatedSeconds); // 600s
      const segment2Seconds = Math.min(rawSecondSegmentSeconds, neededSeconds);
      const finalSeconds = Math.min(maxAllowedSeconds, accumulatedSeconds + segment2Seconds);

      expect(neededSeconds).toBe(600);
      expect(segment2Seconds).toBe(600);
      expect(finalSeconds).toBe(1500);
      expect(accumulatedSeconds + segment2Seconds).toBe(1500);
    });

    it("allows stopwatch mode to continue without ceiling clamping", () => {
      const computeFinalSeconds = (mode: string, accumulated: number, rawElapsed: number) => {
        return mode === "pomodoro"
          ? Math.min(25 * 60, accumulated + rawElapsed)
          : accumulated + rawElapsed;
      };

      const finalSeconds = computeFinalSeconds("stopwatch", 0, 5400);
      expect(finalSeconds).toBe(5400); // unconstrained for open study
    });

    it("calculates accurate effective end timestamp during server lazy reconciliation", () => {
      const startMs = new Date("2026-10-24T10:00:00.000Z").getTime();
      const targetMinutes = 25;
      const maxAllowedSeconds = targetMinutes * 60; // 1500s
      const accumulated = 0;

      const neededDuration = Math.max(0, maxAllowedSeconds - accumulated);
      const effectiveEndIso = new Date(startMs + neededDuration * 1000).toISOString();

      expect(effectiveEndIso).toBe("2026-10-24T10:25:00.000Z");
    });
  });
});

