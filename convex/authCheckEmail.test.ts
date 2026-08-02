import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";

// Same glob dance as guards.integration.test.ts — convex-test needs the
// whole function module graph (incl. `_generated`) to route `t.fetch`.
declare global {
  interface ImportMeta {
    glob(pattern: string): Record<string, () => Promise<Record<string, unknown>>>;
  }
}

const modules = Object.fromEntries(
  Object.entries(import.meta.glob("./**/*.{ts,js}")).filter(
    ([path]) => !path.endsWith(".d.ts") && !/\.(test|spec|config)\./.test(path),
  ),
);

const LOGIN_CHECK_RATE_MAX = 30;

function post(t: ReturnType<typeof convexTest>, email: string) {
  return t.fetch("/api/auth/check-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Allow-listed dev origin, otherwise rejectIfBadOrigin 403s.
      origin: "http://localhost:3000",
      "x-real-ip": "203.0.113.7",
    },
    body: JSON.stringify({ email }),
  });
}

describe("/api/auth/check-email over the per-IP cap", () => {
  it("degrades to exists:null instead of refusing the request", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", { email: "ada@example.com" });
    });

    // Burn the whole hourly budget for this IP.
    for (let i = 0; i < LOGIN_CHECK_RATE_MAX; i++) {
      const res = await post(t, `probe${i}@example.com`);
      expect(res.status).toBe(200);
    }

    // The 31st request is the launch-day CGNAT visitor. A 429 here left
    // the client with no flow to pick and killed signup for everyone
    // behind that exit IP.
    const overflow = await post(t, "ada@example.com");
    expect(overflow.status).toBe(200);
    expect(await overflow.json()).toEqual({ exists: null });

    // And it must stay null for an address that does NOT exist — the
    // degraded answer carries no signal either way.
    const unknown = await post(t, "nobody@example.com");
    expect(await unknown.json()).toEqual({ exists: null });
  });
});
