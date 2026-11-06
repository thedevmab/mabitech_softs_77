import { describe, expect, it } from "vitest";
import { DEFAULT_HOME_SECTIONS, DEFAULT_BRANDING } from "@/lib/branding";

describe("home section defaults", () => {
  it("has enabled sections with keys", () => {
    expect(DEFAULT_HOME_SECTIONS.length).toBeGreaterThan(0);
    for (const section of DEFAULT_HOME_SECTIONS) {
      expect(section.key).toBeTruthy();
      expect(["posts", "software", "sponsored"]).toContain(section.type);
    }
  });

  it("uses official brand hex values", () => {
    expect(DEFAULT_BRANDING.light.primary).toBe("#083687");
    expect(DEFAULT_BRANDING.light.secondary).toBe("#FFAE00");
  });
});
