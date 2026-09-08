import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("env validator (lazy getter)", () => {
  const origUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const origSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (origUrl === undefined) delete process.env.NEXT_PUBLIC_CONVEX_URL;
    else process.env.NEXT_PUBLIC_CONVEX_URL = origUrl;
    if (origSiteUrl === undefined) delete process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
    else process.env.NEXT_PUBLIC_CONVEX_SITE_URL = origSiteUrl;
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
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://realdeploy.convex.cloud";
    const mod = await import("./env");
    expect(mod.env.NEXT_PUBLIC_CONVEX_URL).toBe("https://realdeploy.convex.cloud");
  });

  it("convexHttpUrl memakai origin site eksplisit untuk custom domain", async () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://api.careerpack.org";
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL = "https://site.careerpack.org";
    const mod = await import("./env");
    expect(mod.convexHttpUrl("/api/health")).toBe(
      "https://site.careerpack.org/api/health",
    );
  });

  it("convexHttpUrl tetap derive .convex.site untuk Convex Cloud", async () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://realdeploy.convex.cloud";
    delete process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
    const mod = await import("./env");
    expect(mod.convexHttpUrl("api/health")).toBe(
      "https://realdeploy.convex.site/api/health",
    );
  });

  it("throw kalau nilai = Docker placeholder", async () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";
    const mod = await import("./env");
    expect(() => mod.env.NEXT_PUBLIC_CONVEX_URL).toThrow(
      /placeholder|build-arg/,
    );
  });
});
