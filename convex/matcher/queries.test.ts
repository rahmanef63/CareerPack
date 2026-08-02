import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";
import { api } from "../_generated/api";

declare global {
  interface ImportMeta {
    glob(pattern: string): Record<string, () => Promise<Record<string, unknown>>>;
  }
}

// convex-test module graph: recursive glob misses this test's own dir, so add
// an explicit same-dir glob remapped to the `../matcher/` root shape.
const recursive = import.meta.glob("../**/*.{ts,js}");
const sameDir = Object.fromEntries(
  Object.entries(import.meta.glob("./*.{ts,js}")).map(([path, mod]) => [
    path.replace(/^\.\//, "../matcher/"),
    mod,
  ]),
);
const modules = Object.fromEntries(
  Object.entries({ ...recursive, ...sameDir }).filter(
    ([path]) => !path.endsWith(".d.ts") && !/\.(test|spec|config)\./.test(path),
  ),
);

type Tester = ReturnType<typeof convexTest>;

function setup(): Tester {
  return convexTest(schema, modules);
}

// Minimal valid jobListings row — only the salary/category fields vary.
function listing(i: number, opts: Partial<{ salaryMin: number; salaryMax: number }>) {
  return {
    title: `Engineer ${i}`,
    company: "Acme",
    location: "Remote",
    workMode: "remote",
    employmentType: "full-time",
    seniority: "mid",
    description: "x",
    requiredSkills: [],
    postedAt: 1_000 + i,
    currency: "IDR",
    category: "engineering",
    ...opts,
  };
}

async function seedListings(t: Tester, n: number): Promise<void> {
  await t.run(async (ctx) => {
    for (let i = 0; i < n; i++) {
      await ctx.db.insert(
        "jobListings",
        listing(i, { salaryMin: 10_000_000, salaryMax: 20_000_000 }),
      );
    }
  });
}

describe("getSalaryInsights — capped honesty flag", () => {
  it("does not flag capped when listings fit under the scan cap", async () => {
    const t = setup();
    await seedListings(t, 10);

    const res = await t.query(api.matcher.queries.getSalaryInsights, {});

    expect(res.capped).toBe(false);
    expect(res.scannedCount).toBe(10);
    expect(res.categories.length).toBe(1);
    expect(res.categories[0].p50).toBe(15_000_000);
  });

  it("flags capped + reports the scan ceiling when listings exceed it", async () => {
    const t = setup();
    // 501 rows — one past the 500 most-recent cap, so older rows are
    // truncated and the percentiles describe a recent window only.
    await seedListings(t, 501);

    const res = await t.query(api.matcher.queries.getSalaryInsights, {});

    expect(res.capped).toBe(true);
    expect(res.scannedCount).toBe(500); // hard scan ceiling, not 501
  });

  it("returns an empty, non-capped result for an empty table", async () => {
    const t = setup();

    const res = await t.query(api.matcher.queries.getSalaryInsights, {});

    expect(res.capped).toBe(false);
    expect(res.scannedCount).toBe(0);
    expect(res.categories).toEqual([]);
  });
});
