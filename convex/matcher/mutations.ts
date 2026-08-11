import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../_shared/auth";
import { inferCategoryDetailed } from "./external";
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

/**
 * Re-run `inferCategory` over RemoteOK rows already in the table.
 *
 * The old inference merged the title with every tag and tested "design"
 * first, so listings like "Java Developer" (tagged `dev, design, docker`)
 * and "Procurement Specialist" were filed under Design. Fixing the function
 * only helps rows fetched afterwards — the feed cron runs daily and dedupes
 * by `externalId`, so a stale row keeps its wrong category indefinitely.
 *
 * WWR rows are skipped: their category comes from the RSS feed URL, which is
 * ground truth, and re-inferring it would be a downgrade.
 */
export const recategorizeJobs = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  returns: v.object({
    scanned: v.number(),
    changed: v.number(),
    samples: v.array(v.string()),
  }),
  // internalMutation, not a public admin one: this is a one-off data repair
  // run from the CLI, and there is no button for it. Internal functions are
  // unreachable from any client, which is a stronger guarantee than
  // `requireAdmin` and needs no session.
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("jobListings")
      .withIndex("by_source_posted", (q) => q.eq("source", "remoteok"))
      .collect();

    let changed = 0;
    const samples: string[] = [];
    for (const row of rows) {
      // For RemoteOK rows `requiredSkills` IS the raw tag array the feed
      // supplied (external.ts:259), so this re-scores off the same signal the
      // original inference saw.
      const { category: next, fromTitle } = inferCategoryDetailed(
        row.title,
        (row.requiredSkills ?? []).map((t: string) => t.toLowerCase()),
      );
      // Only rewrite when the title is decisive. The tag path is an unvalidated
      // heuristic; running it over 2,809 rows moved 56% of them and collapsed
      // 72% into engineering, which is a different wrong answer, not a fix.
      if (!fromTitle || next === row.category) continue;
      changed++;
      if (samples.length < 10) {
        samples.push(`${row.title} :: ${row.category} -> ${next}`);
      }
      if (!args.dryRun) await ctx.db.patch(row._id, { category: next });
    }
    return { scanned: rows.length, changed, samples };
  },
});
