import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../schema";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { CALIB_WINDOW_MS } from "./lib";

declare global {
  interface ImportMeta {
    glob(pattern: string): Record<string, () => Promise<Record<string, unknown>>>;
  }
}

// convex-test resolves functions by matching the module-key suffix against the
// reference path (e.g. `engine/outcomes/calibrator`). This test is two levels
// deep, and Vite's recursive `**` glob excludes the importing file's own dir —
// so glob the convex root (`../../`) for the bulk, glob this dir explicitly for
// the missing local files, then normalize every key to a single root-relative
// shape (strip the `../../` prefix). Consistent prefixes are what convex-test
// needs; a mix of `../../engine/…` and `../engine/…` breaks resolution.
const recursive = Object.entries(import.meta.glob("../../**/*.{ts,js}")).map(
  ([path, mod]) => [path.replace(/^\.\.\/\.\.\//, ""), mod] as const,
);
const sameDir = Object.entries(import.meta.glob("./*.{ts,js}")).map(
  ([path, mod]) =>
    [path.replace(/^\.\//, "engine/outcomes/"), mod] as const,
);
const modules = Object.fromEntries(
  [...recursive, ...sameDir].filter(
    ([path]) => !path.endsWith(".d.ts") && !/\.(test|spec|config)\./.test(path),
  ),
);

type Tester = ReturnType<typeof convexTest>;

function setup(): Tester {
  return convexTest(schema, modules);
}

async function insertUser(t: Tester): Promise<Id<"users">> {
  return t.run((ctx) => ctx.db.insert("users", { email: "calib@x.com" }));
}

/** Seed `n` `apply` outcome events for an edge at a given timestamp. */
async function seedApplies(
  t: Tester,
  userId: Id<"users">,
  from: string,
  to: string,
  occurredAt: number,
  n: number,
): Promise<void> {
  await t.run(async (ctx) => {
    for (let i = 0; i < n; i++) {
      await ctx.db.insert("outcomeEvents", {
        userId,
        kind: "apply",
        fromNodeSlug: from,
        targetNodeSlug: to,
        occurredAt,
      });
    }
  });
}

describe("runCalibrator window exclusion", () => {
  it("excludes events older than the calibration window from the posterior", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const now = Date.now();

    // In-window edge: 6 applies (> MIN_COHORT_K) at "now".
    await seedApplies(t, userId, "junior", "senior", now, 6);
    // Out-of-window edge: 6 applies, but 200 days old (> 180d window).
    await seedApplies(
      t,
      userId,
      "stale-from",
      "stale-to",
      now - CALIB_WINDOW_MS - 5 * 24 * 60 * 60 * 1000,
      6,
    );

    await t.mutation(internal.engine.outcomes.calibrator.runCalibrator, {});

    const stats = await t.run((ctx) =>
      ctx.db.query("nodeOutcomeStats").collect(),
    );

    // The fresh edge is published…
    const fresh = stats.find(
      (s) => s.fromNodeSlug === "junior" && s.toNodeSlug === "senior",
    );
    expect(fresh).toBeTruthy();
    expect(fresh?.applies).toBe(6);

    // …the stale edge never enters the aggregate at all.
    const stale = stats.find(
      (s) => s.fromNodeSlug === "stale-from" && s.toNodeSlug === "stale-to",
    );
    expect(stale).toBeUndefined();
  });

  it("does not double-count when older events share an edge with fresh ones", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const now = Date.now();

    // Same edge, mixed ages: 6 fresh + 4 stale. Only the 6 fresh count.
    await seedApplies(t, userId, "a", "b", now, 6);
    await seedApplies(
      t,
      userId,
      "a",
      "b",
      now - CALIB_WINDOW_MS - 24 * 60 * 60 * 1000,
      4,
    );

    await t.mutation(internal.engine.outcomes.calibrator.runCalibrator, {});

    const stats = await t.run((ctx) =>
      ctx.db.query("nodeOutcomeStats").collect(),
    );
    const row = stats.find(
      (s) => s.fromNodeSlug === "a" && s.toNodeSlug === "b",
    );
    expect(row?.applies).toBe(6);
  });
});
