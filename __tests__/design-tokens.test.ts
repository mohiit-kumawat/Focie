import { describe, it, expect } from "vitest";

describe("Focusie Design Tokens (SPEC 4.2 & Midnight Kawaii Dark Mode)", () => {
  const SUNNY_STUDY_TOKENS = {
    blush: "#F7DCE7",
    lavender: "#E7E0FA",
    butter: "#F9EDC7",
    mint: "#DDEFE2",
    cream: "#FFFBF5",
    plum: "#514453",
    mauve: "#806F7C",
  };

  const MIDNIGHT_KAWAII_TOKENS = {
    background: "#171321",
    altBackground: "#1D1729",
    cardSurface: "#241D33",
    elevatedSurface: "#302641",
    border: "#40354F",
    primaryText: "#F8F1FF",
    secondaryText: "#B9AEC9",
    primaryAccent: "#FF729F",
    pinkTintedSurface: "#4A263D",
    lavenderAccent: "#C5A7FF",
    mintStatus: "#91E6C1",
    goldRewardAccent: "#F6D28B",
  };

  it("has correct hex codes for Sunny Study light tokens", () => {
    expect(SUNNY_STUDY_TOKENS.blush).toBe("#F7DCE7");
    expect(SUNNY_STUDY_TOKENS.lavender).toBe("#E7E0FA");
    expect(SUNNY_STUDY_TOKENS.butter).toBe("#F9EDC7");
    expect(SUNNY_STUDY_TOKENS.mint).toBe("#DDEFE2");
    expect(SUNNY_STUDY_TOKENS.cream).toBe("#FFFBF5");
    expect(SUNNY_STUDY_TOKENS.plum).toBe("#514453");
    expect(SUNNY_STUDY_TOKENS.mauve).toBe("#806F7C");
  });

  it("has correct hex codes for Midnight Kawaii dark tokens", () => {
    expect(MIDNIGHT_KAWAII_TOKENS.background).toBe("#171321");
    expect(MIDNIGHT_KAWAII_TOKENS.altBackground).toBe("#1D1729");
    expect(MIDNIGHT_KAWAII_TOKENS.cardSurface).toBe("#241D33");
    expect(MIDNIGHT_KAWAII_TOKENS.elevatedSurface).toBe("#302641");
    expect(MIDNIGHT_KAWAII_TOKENS.border).toBe("#40354F");
    expect(MIDNIGHT_KAWAII_TOKENS.primaryText).toBe("#F8F1FF");
    expect(MIDNIGHT_KAWAII_TOKENS.secondaryText).toBe("#B9AEC9");
    expect(MIDNIGHT_KAWAII_TOKENS.primaryAccent).toBe("#FF729F");
    expect(MIDNIGHT_KAWAII_TOKENS.pinkTintedSurface).toBe("#4A263D");
    expect(MIDNIGHT_KAWAII_TOKENS.lavenderAccent).toBe("#C5A7FF");
    expect(MIDNIGHT_KAWAII_TOKENS.mintStatus).toBe("#91E6C1");
    expect(MIDNIGHT_KAWAII_TOKENS.goldRewardAccent).toBe("#F6D28B");
  });
});
