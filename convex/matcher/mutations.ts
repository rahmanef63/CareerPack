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

    // Scoped to seed rows only. This used to read the WHOLE table and bail
    // when it held >= SEED_JOBS.length rows — the daily feed cron pushed the
    // table past 8 long ago, so the button had become a permanent no-op and
    // the curated Indonesian listings could never be loaded.
    const existing = await ctx.db
      .query("jobListings")
      .withIndex("by_source_posted", (q) => q.eq("source", "seed"))
      .collect();
    const existingKeys = new Set(existing.map((j) => `${j.title}|${j.company}`));

    let seeded = 0;
    for (const j of SEED_JOBS) {
      if (existingKeys.has(`${j.title}|${j.company}`)) continue;
      // Tag provenance so `pruneOldJobs`' never-prune guard actually
      // matches — SEED_JOBS rows carry no `source` of their own.
      await ctx.db.insert("jobListings", { ...j, source: "seed" });
      seeded++;
    }
    return { seeded };
  },
});
