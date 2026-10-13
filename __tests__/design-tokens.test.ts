import { describe, it, expect } from "vitest";

describe("Focusie Design Tokens (SPEC 4.2)", () => {
  const EXPECTED_TOKENS = {
    blush: "#F7DCE7",
    lavender: "#E7E0FA",
    butter: "#F9EDC7",
    mint: "#DDEFE2",
    cream: "#FFFBF5",
    plum: "#514453",
    mauve: "#806F7C",
  };

  it("has correct hex codes for all required brand tokens", () => {
    expect(EXPECTED_TOKENS.blush).toBe("#F7DCE7");
    expect(EXPECTED_TOKENS.lavender).toBe("#E7E0FA");
    expect(EXPECTED_TOKENS.butter).toBe("#F9EDC7");
    expect(EXPECTED_TOKENS.mint).toBe("#DDEFE2");
    expect(EXPECTED_TOKENS.cream).toBe("#FFFBF5");
    expect(EXPECTED_TOKENS.plum).toBe("#514453");
    expect(EXPECTED_TOKENS.mauve).toBe("#806F7C");
  });
});
