import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireSuperAdmin } from "../../_shared/auth";
import { CAREER_GRAPH_SEED } from "../../_seeds/careerGraph";
import type { Id } from "../../_generated/dataModel";

/**
 * Bootstrap (or refresh) the career graph from the in-repo seed
 * dataset. Idempotent: matches existing rows by `slug` /
 * `(fromSlug,toSlug)`, patches their fields if anything changed,
 * inserts only missing rows. Safe to re-run after every seed edit.
 *
 * Super-admin only — this populates a globally-visible table.
 */
export const seedDefaults = mutation({
  args: {},
  returns: v.object({
    nodesInserted: v.number(),
    nodesUpdated: v.number(),
    edgesInserted: v.number(),
    edgesUpdated: v.number(),
  }),
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    let nodesInserted = 0;
    let nodesUpdated = 0;
    const slugToId = new Map<string, Id<"careerNodes">>();

    for (const seed of CAREER_GRAPH_SEED.nodes) {
      const existing = await ctx.db
        .query("careerNodes")
        .withIndex("by_slug", (q) => q.eq("slug", seed.slug))
        .first();
      if (existing) {
        slugToId.set(seed.slug, existing._id);
        // Only patch when something actually changed — avoids
        // touching unrelated fields and keeps `_creationTime`
        // semantics honest.
        if (
          existing.label !== seed.label ||
          existing.role !== seed.role ||
          existing.seniority !== seed.seniority ||
          JSON.stringify(existing.requiredSkills) !==
            JSON.stringify(seed.requiredSkills) ||
          existing.description !== seed.description ||
          JSON.stringify(existing.salaryByeSector) !==
            JSON.stringify(seed.salaryByeSector)
        ) {
          await ctx.db.patch(existing._id, {
            label: seed.label,
            role: seed.role,
            seniority: seed.seniority,
            requiredSkills: seed.requiredSkills,
            description: seed.description,
            salaryByeSector: seed.salaryByeSector,
          });
          nodesUpdated++;
        }
      } else {
        const id = await ctx.db.insert("careerNodes", {
          slug: seed.slug,
          label: seed.label,
          role: seed.role,
          seniority: seed.seniority,
          requiredSkills: seed.requiredSkills,
          description: seed.description,
          salaryByeSector: seed.salaryByeSector,
        });
        slugToId.set(seed.slug, id);
        nodesInserted++;
      }
    }

    let edgesInserted = 0;
    let edgesUpdated = 0;

    for (const seed of CAREER_GRAPH_SEED.edges) {
      const fromId = slugToId.get(seed.fromSlug);
      const toId = slugToId.get(seed.toSlug);
      if (!fromId || !toId) {
        // Seed sanity: skip + log via error sink? For seed pass,
        // throwing surfaces the typo immediately.
        throw new Error(
          `Edge references unknown slug: ${seed.fromSlug} → ${seed.toSlug}`,
        );
      }

      const candidates = await ctx.db
        .query("careerEdges")
        .withIndex("by_from", (q) => q.eq("fromNodeId", fromId))
        .collect();
      const existing = candidates.find((e) => e.toNodeId === toId);

      if (existing) {
        if (
          existing.probability !== seed.probability ||
          existing.durationMonthsMedian !== seed.durationMonthsMedian ||
          existing.sampleSize !== seed.sampleSize ||
          JSON.stringify(existing.acquiredSkills) !==
            JSON.stringify(seed.acquiredSkills)
        ) {
          await ctx.db.patch(existing._id, {
            probability: seed.probability,
            durationMonthsMedian: seed.durationMonthsMedian,
            acquiredSkills: seed.acquiredSkills,
            sampleSize: seed.sampleSize,
          });
          edgesUpdated++;
        }
      } else {
        await ctx.db.insert("careerEdges", {
          fromNodeId: fromId,
          toNodeId: toId,
          probability: seed.probability,
          durationMonthsMedian: seed.durationMonthsMedian,
          acquiredSkills: seed.acquiredSkills,
          sampleSize: seed.sampleSize,
        });
        edgesInserted++;
      }
    }

    return { nodesInserted, nodesUpdated, edgesInserted, edgesUpdated };
  },
});
