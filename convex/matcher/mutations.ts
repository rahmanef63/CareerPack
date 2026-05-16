import { mutation } from "../_generated/server";
import { requireAdmin } from "../_shared/auth";
import { SEED_JOBS } from "./seedJobs";

/**
 * Seed helper — populate demo jobs. Idempotent per (title+company) key.
 * Admin-only: anyone-logged-in had write access before, which let
 * authenticated attackers spam the public `jobListings` catalog. Probe
 * via `.first()` so the no-op fast-path doesn't materialize the whole
 * table on each call.
 */
export const seedDemoJobs = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const sample = await ctx.db.query("jobListings").first();
    if (sample) {
      const existing = await ctx.db.query("jobListings").collect();
      if (existing.length >= SEED_JOBS.length) return { seeded: 0 };
      const existingKeys = new Set(
        existing.map((j) => `${j.title}|${j.company}`),
      );
      let seeded = 0;
      for (const j of SEED_JOBS) {
        const key = `${j.title}|${j.company}`;
        if (existingKeys.has(key)) continue;
        await ctx.db.insert("jobListings", j);
        seeded++;
      }
      return { seeded };
    }
    let seeded = 0;
    for (const j of SEED_JOBS) {
      await ctx.db.insert("jobListings", j);
      seeded++;
    }
    return { seeded };
  },
});
