import { describe, expect, it } from "vitest";
import { fallbackTriageNotes, normalizeGloss, validateTriageNotes } from "@/lib/llm";

describe("llm fallback", () => {
  it("normalizes noisy gloss input", () => {
    expect(normalizeGloss("  pain <script> chest  ")).toBe("pain script chest");
  });

  it("returns complete multilingual notes", () => {
    const notes = fallbackTriageNotes("CHEST PAIN 2 HOURS");

    expect(validateTriageNotes(notes)).toBe(true);
    expect(notes.clinicianNotes.en).toContain("CHEST PAIN");
    expect(notes.clinicianNotes.ru.length).toBeGreaterThan(10);
    expect(notes.safetyFlags).toContain("contains_chest");
  });
});
