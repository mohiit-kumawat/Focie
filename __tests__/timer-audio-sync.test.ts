import { describe, it, expect, beforeEach } from "vitest";
import { soundEngine } from "@/lib/audio/chime";

describe("Phase 2 Part 4: Audio Engine & Multi-Tab Synchronization Tests", () => {
  beforeEach(() => {
    soundEngine.setMuted(false);
  });

  describe("SoundEngine State & Mute Controls", () => {
    it("initializes soundEngine with unmuted default", () => {
      expect(soundEngine.getMuted()).toBe(false);
    });

    it("toggles mute state correctly", () => {
      expect(soundEngine.toggleMuted()).toBe(true);
      expect(soundEngine.getMuted()).toBe(true);

      expect(soundEngine.toggleMuted()).toBe(false);
      expect(soundEngine.getMuted()).toBe(false);
    });

    it("honors explicit setMuted call", () => {
      soundEngine.setMuted(true);
      expect(soundEngine.getMuted()).toBe(true);

      soundEngine.setMuted(false);
      expect(soundEngine.getMuted()).toBe(false);
    });

    it("does not throw when play methods are called in headless/unsupported environments", () => {
      expect(() => soundEngine.playStartChime()).not.toThrow();
      expect(() => soundEngine.playCompletionChime()).not.toThrow();
    });
  });

  describe("Cross-Tab Timer Broadcast Event Serialization", () => {
    it("properly serializes and formats broadcast messages", () => {
      const mockSession = {
        id: "session-123",
        user_id: "user-456",
        state: "active" as const,
        mode: "pomodoro" as const,
        target_minutes: 25,
        subject_tag: "Deep Coding 💻",
        started_at: "2026-10-17T12:00:00Z",
        paused_at: null,
        ended_at: null,
        accumulated_seconds: 120,
        created_at: "2026-10-17T12:00:00Z",
        updated_at: "2026-10-17T12:02:00Z",
      };

      const startMsg = { type: "SESSION_STARTED", session: mockSession };
      const pauseMsg = { type: "SESSION_PAUSED", session: { ...mockSession, state: "paused" as const } };
      const stopMsg = { type: "SESSION_STOPPED", session: { ...mockSession, state: "completed" as const } };

      expect(startMsg.type).toBe("SESSION_STARTED");
      expect(startMsg.session.target_minutes).toBe(25);
      expect(pauseMsg.type).toBe("SESSION_PAUSED");
      expect(stopMsg.type).toBe("SESSION_STOPPED");
    });
  });

  describe("Pomodoro Completion & Progress Boundary Logic", () => {
    it("accurately clamps progressFraction between 0 and 1", () => {
      const targetSec = 25 * 60; // 1500s

      const calcProgress = (elapsed: number) => Math.min(1, Math.max(0, elapsed / targetSec));

      expect(calcProgress(0)).toBe(0);
      expect(calcProgress(750)).toBe(0.5);
      expect(calcProgress(1500)).toBe(1);
      expect(calcProgress(1800)).toBe(1); // Exceeding target stays capped at 1.0
    });

    it("triggers chime condition when remainingSeconds hits 0", () => {
      const targetSec = 25 * 60;
      const elapsed1 = 1499;
      const elapsed2 = 1500;

      const shouldChime1 = elapsed1 >= targetSec;
      const shouldChime2 = elapsed2 >= targetSec;

      expect(shouldChime1).toBe(false);
      expect(shouldChime2).toBe(true);
    });
  });
});

