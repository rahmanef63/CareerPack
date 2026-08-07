import { describe, it, expect } from "vitest";
import { AI_PROVIDERS } from "./aiProviders";
import { normalizeModelId, visionSupport } from "./aiVision";

describe("normalizeModelId", () => {
  it("strips the vendor prefix and casing", () => {
    expect(normalizeModelId("openai/GPT-4o-mini")).toBe("gpt-4o-mini");
    expect(normalizeModelId("  gemini-2.5-flash  ")).toBe("gemini-2.5-flash");
    expect(normalizeModelId("")).toBe("");
  });
});

describe("visionSupport", () => {
  it("knows the models that can read an image", () => {
    expect(visionSupport("gpt-4o-mini")).toBe("yes");
    expect(visionSupport("openai/gpt-4o-mini")).toBe("yes");
    expect(visionSupport("google/gemini-2.5-flash")).toBe("yes");
  });

  it("knows the text-only models, case-insensitively", () => {
    // A groq/deepseek/glm user must be told to switch models, not handed the
    // generic "coba lagi beberapa menit lagi" for a permanent failure.
    expect(visionSupport("llama-3.3-70b-versatile")).toBe("no");
    expect(visionSupport("GLM-4.6")).toBe("no");
    expect(visionSupport("deepseek-chat")).toBe("no");
    expect(visionSupport("moonshotai/kimi-k2")).toBe("no");
  });

  it("classifies every model the provider catalog offers", () => {
    // The lists are hand-maintained against AI_PROVIDERS; a model we ship in
    // the settings dropdown must never be the one that falls through to
    // "unknown", because then the warning lands on a user who picked from OUR
    // menu. Only `custom` is allowed to be unknowable.
    for (const provider of Object.values(AI_PROVIDERS)) {
      if (provider.id === "custom") continue;
      for (const model of provider.models) {
        expect([model, visionSupport(model)]).not.toEqual([model, "unknown"]);
      }
    }
  });

  it("fails open on anything it has never heard of", () => {
    // The `custom` provider accepts any model string; hard-blocking on an
    // exact-match Set would lock those users out of the import entirely.
    expect(visionSupport("acme-vl-7b")).toBe("unknown");
    expect(visionSupport("")).toBe("unknown");
  });
});
