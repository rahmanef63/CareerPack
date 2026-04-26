import { mutation } from "../_generated/server";
import { requireUser } from "../_shared/auth";
import { SEED_JOBS } from "./seedJobs";

/**
 * Seed helper — populate demo jobs. Idempotent per (title+company) key.
 * Public catalog: rows have no userId; we just avoid duplicates if
 * called twice. Auth-gated to prevent anonymous spam.
 */
export const seedDemoJobs = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);

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
  },
});
