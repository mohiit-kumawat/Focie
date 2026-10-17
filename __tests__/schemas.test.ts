import { describe, it, expect } from "vitest";
import {
  usernameSchema,
  studyDaySettingsSchema,
  loginSchema,
  registerSchema,
} from "@/lib/validations/auth";

describe("Validation Schemas (SPEC FR-01 & FR-05)", () => {
  describe("Username validation", () => {
    it("accepts valid usernames", () => {
      expect(usernameSchema.parse("fumi_study")).toBe("fumi_study");
      expect(usernameSchema.parse("mohit123")).toBe("mohit123");
      expect(usernameSchema.parse("abc")).toBe("abc");
    });

    it("rejects usernames with uppercase letters", () => {
      expect(() => usernameSchema.parse("FumiStudy")).toThrow();
    });

    it("rejects usernames with invalid symbols", () => {
      expect(() => usernameSchema.parse("user@name")).toThrow();
      expect(() => usernameSchema.parse("user-name")).toThrow();
      expect(() => usernameSchema.parse("user.name")).toThrow();
    });

    it("rejects usernames that are too short or too long", () => {
      expect(() => usernameSchema.parse("ab")).toThrow();
      expect(() => usernameSchema.parse("a".repeat(25))).toThrow();
    });
  });

  describe("Study day settings validation", () => {
    it("accepts valid 24h format HH:MM and timezone", () => {
      const valid = { timezone: "Asia/Kolkata", day_start_time: "06:00" };
      expect(studyDaySettingsSchema.parse(valid)).toEqual(valid);

      const midnight = { timezone: "UTC", day_start_time: "00:00" };
      expect(studyDaySettingsSchema.parse(midnight)).toEqual(midnight);

      const nightOwl = { timezone: "America/New_York", day_start_time: "23:59" };
      expect(studyDaySettingsSchema.parse(nightOwl)).toEqual(nightOwl);
    });

    it("rejects invalid time formats", () => {
      expect(() =>
        studyDaySettingsSchema.parse({ timezone: "UTC", day_start_time: "24:00" })
      ).toThrow();
      expect(() =>
        studyDaySettingsSchema.parse({ timezone: "UTC", day_start_time: "6:00" })
      ).toThrow();
      expect(() =>
        studyDaySettingsSchema.parse({ timezone: "UTC", day_start_time: "06:60" })
      ).toThrow();
      expect(() =>
        studyDaySettingsSchema.parse({ timezone: "UTC", day_start_time: "morning" })
      ).toThrow();
    });
  });

  describe("Login validation", () => {
    it("accepts valid email and password", () => {
      const valid = { email: "mohit@example.com", password: "password123" };
      expect(loginSchema.parse(valid)).toEqual(valid);
    });

    it("rejects invalid email formats", () => {
      expect(() =>
        loginSchema.parse({ email: "invalid-email", password: "password123" })
      ).toThrow();
    });

    it("rejects short password", () => {
      expect(() =>
        loginSchema.parse({ email: "mohit@example.com", password: "123" })
      ).toThrow();
    });
  });

  describe("Register validation", () => {
    it("accepts valid registration payload", () => {
      const valid = {
        email: "mohit@example.com",
        password: "secretpassword",
        confirmPassword: "secretpassword",
      };
      expect(registerSchema.parse(valid)).toEqual(valid);
    });

    it("rejects mismatched confirm password", () => {
      expect(() =>
        registerSchema.parse({
          email: "mohit@example.com",
          password: "secretpassword",
          confirmPassword: "differentpassword",
        })
      ).toThrow();
    });
  });
});

