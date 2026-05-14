import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Career Graph — the proprietary ID-specific career-state manifold.
 *
 * Nodes = canonical career states (role + seniority). Edges =
 * observed transitions with probability + duration + skill delta.
 * Seeded from a hand-curated ID labor-market dataset (tech tracks
 * first); future phases enrich edge stats from anonymised user
 * outcome telemetry (Phase 4).
 *
 * Pure Convex — no graph database, no new dependency. BFS +
 * Markov-chain composition run inside actions / queries against the
 * relational indexes below.
 */
export const graphTables = {
  careerNodes: defineTable({
    /**
     * Stable, human-readable identifier — used as the public handle
     * in frontend URLs and seed-data references. e.g.
     * `backend-eng-senior`, `pm-mid`.
     */
    slug: v.string(),

    /** Display label, e.g. "Senior Backend Engineer". */
    label: v.string(),

    /** Track family, e.g. "Backend Engineer", "Product Manager". */
    role: v.string(),

    seniority: v.union(
      v.literal("intern"),
      v.literal("junior"),
      v.literal("mid"),
      v.literal("senior"),
      v.literal("lead"),
      v.literal("principal"),
    ),

    /**
     * Median annual gross salary by ID sector (IDR). Optional — not
     * every node has data yet; UI handles missing gracefully.
     * Sectors:
     *   - fintech    — banks, lending, payments
     *   - ecommerce  — marketplaces, retail-tech
     *   - saas       — B2B software vendors
     *   - enterprise — telco, corp, government
     */
    salaryByeSector: v.optional(
      v.object({
        fintech: v.optional(v.number()),
        ecommerce: v.optional(v.number()),
        saas: v.optional(v.number()),
        enterprise: v.optional(v.number()),
      }),
    ),

    /**
     * Skills that occupants of this node typically hold — used by
     * the reachability engine for skill-gap analysis against the
     * user's Truth Ledger.
     */
    requiredSkills: v.array(v.string()),

    /** Short Indonesian description shown in the path detail. */
    description: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_role", ["role"])
    .index("by_seniority", ["seniority"]),

  careerEdges: defineTable({
    fromNodeId: v.id("careerNodes"),
    toNodeId: v.id("careerNodes"),

    /**
     * Observed transition probability — 0..1. For seed data this is
     * a curated estimate; Phase 4's outcome calibrator will refine
     * per-cohort posteriors as user telemetry accumulates.
     */
    probability: v.number(),

    /** Median months to make this transition end-to-end. */
    durationMonthsMedian: v.number(),

    /**
     * Skills the user typically *acquires* during this transition —
     * intersect with `toNode.requiredSkills` to compute the gap a
     * given user must close.
     */
    acquiredSkills: v.array(v.string()),

    /**
     * Effective sample-size behind the probability — drives
     * confidence weighting (`sqrt(n)` boost in BFS scoring) so
     * well-attested edges outrank thin priors.
     */
    sampleSize: v.number(),
  })
    .index("by_from", ["fromNodeId"])
    .index("by_to", ["toNodeId"]),
};
