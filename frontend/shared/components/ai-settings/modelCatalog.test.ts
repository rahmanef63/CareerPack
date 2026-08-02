import { describe, it, expect } from "vitest";

import { hasLiveCatalog, modelChips, slugStatus, type CatalogModel } from "./modelCatalog";

const catalog: CatalogModel[] = [
  { id: "openai/gpt-4o-mini", name: "GPT-4o mini", promptUsd: 0.15, completionUsd: 0.6, context: 128000 },
  { id: "x-ai/grok-4", name: "Grok 4", promptUsd: 3, completionUsd: 15, context: 256000 },
];

describe("modelChips", () => {
  it("uses the curated list for a provider that has one", () => {
    const chips = modelChips({ id: "openrouter", models: ["zzz/only-this"] });
    expect(chips[0]).toEqual({ id: "openai/gpt-4o-mini", hint: "Murah, cepat, default" });
    expect(chips.map((c) => c.id)).not.toContain("zzz/only-this");
  });

  it("falls back to the head of the provider's own list", () => {
    const chips = modelChips({ id: "groq", models: ["a", "b", "c"] });
    expect(chips).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
  });

  it("caps the fallback so the row stays a shortcut", () => {
    const models = Array.from({ length: 40 }, (_, i) => `m-${i}`);
    expect(modelChips({ id: "openai", models })).toHaveLength(8);
  });

  it("renders no chips before the provider list arrives", () => {
    expect(modelChips(undefined)).toEqual([]);
  });
});

describe("hasLiveCatalog", () => {
  it("is true only where a catalog action exists", () => {
    expect(hasLiveCatalog("openrouter")).toBe(true);
    expect(hasLiveCatalog("openai")).toBe(false);
    expect(hasLiveCatalog(undefined)).toBe(false);
  });
});

describe("slugStatus", () => {
  it("says nothing about an empty field", () => {
    expect(slugStatus("   ", catalog)).toBe("empty");
  });

  it("says nothing when there is no catalog to check against", () => {
    expect(slugStatus("anything", null)).toBe("unverifiable");
  });

  it("accepts a slug present in the catalog, whitespace and all", () => {
    expect(slugStatus("  x-ai/grok-4 ", catalog)).toBe("valid");
  });

  it("warns rather than rejects a slug the catalog does not list", () => {
    expect(slugStatus("openai/gpt-9", catalog)).toBe("unlisted");
  });
});
