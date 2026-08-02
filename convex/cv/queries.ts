import { internalQuery, query } from "../_generated/server";
import { v } from "convex/values";
import { optionalUser, requireOwnedDoc } from "../_shared/auth";

export const getUserCVs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("cvs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/**
 * Reverse relation: every job application linked to this CV.
 * Powers the "Used by" panel in the CV detail drawer.
 */
export const getApplicationsByCV = query({
  args: { cvId: v.id("cvs") },
  handler: async (ctx, args) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    await requireOwnedDoc(ctx, args.cvId, "CV");
    return await ctx.db
      .query("jobApplications")
      .withIndex("by_user_cv", (q) =>
        q.eq("userId", userId).eq("cvId", args.cvId),
      )
      .order("desc")
      .collect();
  },
});

/**
 * Reverse relation: every ATS scan run against this CV.
 * Same drawer; shows score history without re-running the AI.
 */
export const getATSScansByCV = query({
  args: { cvId: v.id("cvs") },
  handler: async (ctx, args) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    await requireOwnedDoc(ctx, args.cvId, "CV");
    return await ctx.db
      .query("atsScans")
      .withIndex("by_user_cv", (q) =>
        q.eq("userId", userId).eq("cvId", args.cvId),
      )
      .order("desc")
      .collect();
  },
});

// ---------------------------------------------------------------------------
// Internal helpers — used by cv/actions.ts (cover letter generator).
// ---------------------------------------------------------------------------

export const _getOwnedCV = internalQuery({
  args: { cvId: v.id("cvs"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const cv = await ctx.db.get(args.cvId);
    if (!cv || cv.userId !== args.userId) return null;
    return cv;
  },
});

export const _getLatestCV = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cvs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();
  },
});
