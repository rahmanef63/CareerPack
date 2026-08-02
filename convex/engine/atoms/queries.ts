import { v } from "convex/values";
import { query } from "../../_generated/server";
import { optionalUser } from "../../_shared/auth";
import type { Doc } from "../../_generated/dataModel";

/**
 * List active (non-superseded) atoms for a CV owned by the caller.
 *
 * Returns superseded atoms only when `includeHistory: true` — the
 * default render uses the active set.
 */
export const listByCv = query({
  args: {
    cvId: v.id("cvs"),
    includeHistory: v.optional(v.boolean()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, { cvId, includeHistory }) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];

    const cv = await ctx.db.get(cvId);
    if (!cv || cv.userId !== userId) return [];

    const rows = await ctx.db
      .query("truthAtoms")
      .withIndex("by_user_cv", (q) =>
        q.eq("userId", userId).eq("cvId", cvId),
      )
      .collect();

    const filtered = includeHistory
      ? rows
      : rows.filter((r) => r.supersededBy === undefined);

    // Stable order: attestedAt ascending so the UI shows the user's
    // ledger in the order claims were attested.
    return filtered.sort((a, b) => a.attestedAt - b.attestedAt);
  },
});

/**
 * Count active atoms for a CV — cheap badge query for the editor.
 */
export const countActive = query({
  args: { cvId: v.id("cvs") },
  returns: v.number(),
  handler: async (ctx, { cvId }) => {
    const userId = await optionalUser(ctx);
    if (!userId) return 0;
    const cv = await ctx.db.get(cvId);
    if (!cv || cv.userId !== userId) return 0;
    const rows = await ctx.db
      .query("truthAtoms")
      .withIndex("by_user_cv", (q) =>
        q.eq("userId", userId).eq("cvId", cvId),
      )
      .collect();
    return rows.filter((r: Doc<"truthAtoms">) => r.supersededBy === undefined).length;
  },
});

/**
 * Hash-based lookup — Phase 2 will use this for Merkle proof
 * verification. Exposed now so the frontend can hash-and-check before
 * inserting duplicates client-side.
 */
export const getByHash = query({
  args: { hash: v.string() },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, { hash }) => {
    const userId = await optionalUser(ctx);
    if (!userId) return null;
    const row = await ctx.db
      .query("truthAtoms")
      .withIndex("by_hash", (q) => q.eq("hash", hash))
      .first();
    if (!row || row.userId !== userId) return null;
    return row;
  },
});

