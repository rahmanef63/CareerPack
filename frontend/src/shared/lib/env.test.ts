import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("env validator (lazy getter)", () => {
  const origUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (origUrl === undefined) delete process.env.NEXT_PUBLIC_CONVEX_URL;
    else process.env.NEXT_PUBLIC_CONVEX_URL = origUrl;
  });

  it("module import tidak throw walau env kosong", async () => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    await expect(import("./env")).resolves.toBeDefined();
  });

  it("akses nilai throw kalau env kosong", async () => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    const mod = await import("./env");
    expect(() => mod.env.NEXT_PUBLIC_CONVEX_URL).toThrow(
      /NEXT_PUBLIC_CONVEX_URL/,
    );
  });

  it("throw kalau nilai bukan URL", async () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "not-a-url";
    const mod = await import("./env");
    expect(() => mod.env.NEXT_PUBLIC_CONVEX_URL).toThrow(/URL/);
  });

  it("pulangkan URL valid", async () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";
    const mod = await import("./env");
    expect(mod.env.NEXT_PUBLIC_CONVEX_URL).toBe("https://example.convex.cloud");
  });
});
