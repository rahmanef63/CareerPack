import { describe, it, expect } from "vitest";
import { inferCategory } from "./external";

// Real listings from the production feed that came out mislabelled.
describe("inferCategory", () => {
  it("keeps a Java Developer in engineering despite a 'design' tag", () => {
    expect(
      inferCategory("Java Developer", ["dev", "design", "education", "docker"]),
    ).toBe("engineering");
  });

  it("does not file a Procurement Specialist under design", () => {
    expect(inferCategory("Procurement Specialist", ["design", "senior"])).not.toBe("design");
  });

  it("still recognises a real designer", () => {
    expect(inferCategory("Senior Product Designer", ["figma", "ux"])).toBe("design");
  });

  it("lets the title beat the tags in both directions", () => {
    // Title says design, tags say dev — the human reads the title.
    expect(inferCategory("UX Researcher", ["dev", "node"])).toBe("design");
    // Title says engineering, tags say marketing.
    expect(inferCategory("Backend Engineer", ["marketing", "seo"])).toBe("engineering");
  });

  it("uses tags only when the title is uninformative", () => {
    expect(inferCategory("Specialist", ["marketing", "seo"])).toBe("marketing");
  });

  it("falls back to engineering when nothing matches", () => {
    expect(inferCategory("Something Entirely New", [])).toBe("engineering");
  });
});
