import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("env validator", () => {
  const origUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (origUrl === undefined) delete process.env.NEXT_PUBLIC_CONVEX_URL;
    else process.env.NEXT_PUBLIC_CONVEX_URL = origUrl;
  });

  it("throws when NEXT_PUBLIC_CONVEX_URL missing", async () => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    await expect(import("./env")).rejects.toThrow(/NEXT_PUBLIC_CONVEX_URL/);
  });

  it("throws when value is not a valid URL", async () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "not-a-url";
    await expect(import("./env")).rejects.toThrow(/URL/);
  });

  it("accepts valid https URL", async () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";
    const mod = await import("./env");
    expect(mod.env.NEXT_PUBLIC_CONVEX_URL).toBe("https://example.convex.cloud");
  });
});
