import { describe, it, expect } from "vitest";
import {
  getLocalDateParts,
  localToUtc,
  parseDayStartTime,
  getPersonalStudyDayWindow,
  getSharedChallengeWindow,
  getWeeklyStudyWindow,
  calculateIntervalOverlapSeconds,
  calculateTotalFocusedSecondsInWindow,
  formatFocusedTime,
  rankLeaderboardParticipants,
  type LeaderboardParticipant,
} from "@/lib/time/study-day";

describe("Personal Study Day & Interval Overlap Engine (FR-05 & FR-06)", () => {
  describe("1. Timezone & Local Date Parsing", () => {
    it("extracts local date parts accurately for Asia/Kolkata (+5:30)", () => {
      // 2026-10-20 04:30:00 UTC = 2026-10-20 10:00:00 IST
      const utcDate = new Date("2026-10-20T04:30:00.000Z");
      const local = getLocalDateParts(utcDate, "Asia/Kolkata");
      expect(local.year).toBe(2026);
      expect(local.month).toBe(10);
      expect(local.day).toBe(20);
      expect(local.hour).toBe(10);
      expect(local.minute).toBe(0);
    });

    it("converts local time to UTC with exact offset", () => {
      // 06:00 AM IST on Oct 20 -> 00:30 AM UTC on Oct 20
      const utc = localToUtc(2026, 10, 20, 6, 0, 0, "Asia/Kolkata");
      expect(utc.toISOString()).toBe("2026-10-20T00:30:00.000Z");
    });

    it("parses day start time strings reliably", () => {
      expect(parseDayStartTime("06:00:00")).toEqual({ hour: 6, minute: 0 });
      expect(parseDayStartTime("04:30")).toEqual({ hour: 4, minute: 30 });
      expect(parseDayStartTime("")).toEqual({ hour: 6, minute: 0 });
      expect(parseDayStartTime("25:99")).toEqual({ hour: 23, minute: 59 });
    });
  });

  describe("2. Personal Study Day Boundaries", () => {
    it("assigns early morning hours before boundary to the previous day", () => {
      // 04:30 AM local time on Oct 20 with boundary 06:00 AM
      // UTC instant = 2026-10-19T23:00:00.000Z (which is 04:30 AM IST Oct 20)
      const earlyMorningUtc = new Date("2026-10-19T23:00:00.000Z");
      const window = getPersonalStudyDayWindow(earlyMorningUtc, "06:00:00", "Asia/Kolkata");

      // Window should have started Oct 19 06:00 AM IST (Oct 19 00:30 UTC)
      expect(window.windowStart.toISOString()).toBe("2026-10-19T00:30:00.000Z");
      // Window should end Oct 20 06:00 AM IST (Oct 20 00:30 UTC)
      expect(window.windowEnd.toISOString()).toBe("2026-10-20T00:30:00.000Z");
      expect(window.remainingSeconds).toBeGreaterThan(0);
    });

    it("assigns afternoon hours after boundary to the current day", () => {
      // 14:00 (2:00 PM) local time on Oct 20 with boundary 06:00 AM
      // UTC instant = 2026-10-20T08:30:00.000Z
      const afternoonUtc = new Date("2026-10-20T08:30:00.000Z");
      const window = getPersonalStudyDayWindow(afternoonUtc, "06:00:00", "Asia/Kolkata");

      // Window started Oct 20 06:00 AM IST (Oct 20 00:30 UTC)
      expect(window.windowStart.toISOString()).toBe("2026-10-20T00:30:00.000Z");
      // Window ends Oct 21 06:00 AM IST (Oct 21 00:30 UTC)
      expect(window.windowEnd.toISOString()).toBe("2026-10-21T00:30:00.000Z");
    });

    it("computes synchronized 24h shared challenge window in UTC", () => {
      const refDate = new Date("2026-10-20T14:30:00.000Z");
      const window = getSharedChallengeWindow(refDate, 24);

      expect(window.windowStart.toISOString()).toBe("2026-10-20T00:00:00.000Z");
      expect(window.windowEnd.toISOString()).toBe("2026-10-21T00:00:00.000Z");
      expect(window.timezone).toBe("UTC");
    });

    it("computes rolling weekly study window spanning 7 days", () => {
      const refDate = new Date("2026-10-20T14:30:00.000Z");
      const window = getWeeklyStudyWindow(refDate, "06:00:00", "Asia/Kolkata");

      const diffDays =
        (window.windowEnd.getTime() - window.windowStart.getTime()) / (24 * 3600 * 1000);
      expect(diffDays).toBe(7);
    });
  });

  describe("3. Interval Overlap Math & Boundary Splitting", () => {
    const windowStart = "2026-10-20T06:00:00.000Z";
    const windowEnd = "2026-10-21T06:00:00.000Z";

    it("counts 100% of segment when fully inside window", () => {
      // 10:00 to 11:00 (1 hour = 3600s)
      const overlap = calculateIntervalOverlapSeconds(
        "2026-10-20T10:00:00.000Z",
        "2026-10-20T11:00:00.000Z",
        windowStart,
        windowEnd
      );
      expect(overlap).toBe(3600);
    });

    it("correctly splits a cross-boundary session starting before window", () => {
      // Session from 05:30 to 07:00 (90 min total)
      // Exactly 30 min before window (05:30 to 06:00), 60 min inside window (06:00 to 07:00)
      const overlap = calculateIntervalOverlapSeconds(
        "2026-10-20T05:30:00.000Z",
        "2026-10-20T07:00:00.000Z",
        windowStart,
        windowEnd
      );
      expect(overlap).toBe(3600); // exactly 60 minutes counted
    });

    it("correctly splits a cross-boundary session ending after window", () => {
      // Session from 2026-10-21T05:00:00 to 07:00:00 (2 hours total)
      // Exactly 60 min inside window (05:00 to 06:00), 60 min after window (06:00 to 07:00)
      const overlap = calculateIntervalOverlapSeconds(
        "2026-10-21T05:00:00.000Z",
        "2026-10-21T07:00:00.000Z",
        windowStart,
        windowEnd
      );
      expect(overlap).toBe(3600); // exactly 60 minutes counted
    });

    it("returns 0 for segments entirely outside window", () => {
      // Completely before window
      const before = calculateIntervalOverlapSeconds(
        "2026-10-20T02:00:00.000Z",
        "2026-10-20T04:00:00.000Z",
        windowStart,
        windowEnd
      );
      expect(before).toBe(0);

      // Completely after window
      const after = calculateIntervalOverlapSeconds(
        "2026-10-21T08:00:00.000Z",
        "2026-10-21T09:00:00.000Z",
        windowStart,
        windowEnd
      );
      expect(after).toBe(0);
    });

    it("handles currently active ongoing session without ended_at", () => {
      // Session started at 07:00, effectiveNow is 07:45 -> 45 min (2700s)
      const effectiveNow = new Date("2026-10-20T07:45:00.000Z");
      const overlap = calculateIntervalOverlapSeconds(
        "2026-10-20T07:00:00.000Z",
        null,
        windowStart,
        windowEnd,
        effectiveNow
      );
      expect(overlap).toBe(2700);
    });

    it("aggregates multiple segments in window accurately", () => {
      const segments = [
        { startedAt: "2026-10-20T08:00:00.000Z", endedAt: "2026-10-20T08:30:00.000Z" }, // 30m
        { startedAt: "2026-10-20T09:00:00.000Z", endedAt: "2026-10-20T10:00:00.000Z" }, // 60m
        { startedAt: "2026-10-19T20:00:00.000Z", endedAt: "2026-10-19T21:00:00.000Z" }, // 0m (outside)
      ];

      const window = {
        windowStart: new Date(windowStart),
        windowEnd: new Date(windowEnd),
        timezone: "UTC",
        dayStartTime: "06:00:00",
        isCurrentDay: true,
        label: "Test Window",
        remainingSeconds: 3600,
      };

      const total = calculateTotalFocusedSecondsInWindow(segments, window);
      expect(total).toBe(5400); // 30m + 60m = 90m = 5400s
    });
  });

  describe("4. Leaderboard Ranking & Tie Handling (FR-06)", () => {
    it("formats focus duration into clean human strings", () => {
      expect(formatFocusedTime(0)).toBe("0m");
      expect(formatFocusedTime(45 * 60)).toBe("45m");
      expect(formatFocusedTime(2 * 3600)).toBe("2h");
      expect(formatFocusedTime(2 * 3600 + 15 * 60)).toBe("2h 15m");
    });

    it("resolves ties fairly with shared rank and skips following ranks", () => {
      const participants: LeaderboardParticipant[] = [
        {
          userId: "user-1",
          username: "alice",
          displayName: "Alice",
          avatarUrl: null,
          focusedSeconds: 7200, // 2h
        },
        {
          userId: "user-2",
          username: "bob",
          displayName: "Bob",
          avatarUrl: null,
          focusedSeconds: 7200, // 2h (Tied with Alice)
        },
        {
          userId: "user-3",
          username: "charlie",
          displayName: "Charlie",
          avatarUrl: null,
          focusedSeconds: 5400, // 1h 30m
        },
        {
          userId: "user-4",
          username: "dave",
          displayName: "Dave",
          avatarUrl: null,
          focusedSeconds: 1800, // 30m
        },
      ];

      const ranked = rankLeaderboardParticipants(participants, "user-3");

      // Alice & Bob should both be rank 1
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(1);

      // Charlie should be rank 3 (skips rank 2)
      expect(ranked[2].rank).toBe(3);
      expect(ranked[2].isCurrentUser).toBe(true);

      // Dave should be rank 4
      expect(ranked[3].rank).toBe(4);
    });

    it("sorts strictly descending by focusedSeconds", () => {
      const participants: LeaderboardParticipant[] = [
        { userId: "1", username: "p1", displayName: "P1", avatarUrl: null, focusedSeconds: 100 },
        { userId: "2", username: "p2", displayName: "P2", avatarUrl: null, focusedSeconds: 500 },
        { userId: "3", username: "p3", displayName: "P3", avatarUrl: null, focusedSeconds: 300 },
      ];

      const ranked = rankLeaderboardParticipants(participants);
      expect(ranked.map((r) => r.focusedSeconds)).toEqual([500, 300, 100]);
      expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
    });
  });
});

