import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { enforceRateLimit, enforceGlobalWriteLimit } from "../../_shared/rateLimit";
import { requireUser, requireOwnedDoc } from "../../_shared/auth";
import { sanitizeAIInput } from "../../_shared/sanitize";

const outcomeKindValidator = v.union(
  v.literal("apply"),
  v.literal("callback"),
  v.literal("interview"),
  v.literal("offer"),
  v.literal("accepted"),
  v.literal("rejected"),
);

/**
 * Record one contribution per user/job/edge/kind; retries return the existing ID.
 * Notes are sanitised before storage.
 */
export const record = mutation({
  args: {
    kind: outcomeKindValidator,
    cvId: v.optional(v.id("cvs")),
    jobListingId: v.optional(v.id("jobListings")),
    targetNodeSlug: v.optional(v.string()),
    /** User's role at the time the outcome happened — required for
     *  Phase 4.5 edge calibration; optional so legacy / standalone
     *  reports still record. */
    fromNodeSlug: v.optional(v.string()),
    notes: v.optional(v.string()),
    occurredAt: v.optional(v.number()),
  },
  returns: v.id("outcomeEvents"),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (args.cvId) await requireOwnedDoc(ctx, args.cvId, "CV");
    if (args.jobListingId && !(await ctx.db.get(args.jobListingId))) throw new Error("Lowongan tidak ditemukan");
    for (const slug of [args.targetNodeSlug, args.fromNodeSlug]) {
      if (slug !== undefined && (slug.length > 80 || !/^[a-z][a-z0-9-]*$/.test(slug) || !(await ctx.db.query("careerNodes").withIndex("by_slug", q => q.eq("slug", slug)).first()))) throw new Error("Node karier tidak valid");
    }
    const occurredAt = args.occurredAt ?? Date.now();
    if (!Number.isFinite(occurredAt) || occurredAt > Date.now() || occurredAt < Date.now() - 365 * 86_400_000) throw new Error("Tanggal laporan tidak valid");
    const duplicate = await ctx.db.query("outcomeEvents").withIndex("by_user_job_edge_kind", q => q.eq("userId", userId).eq("jobListingId", args.jobListingId).eq("fromNodeSlug", args.fromNodeSlug).eq("targetNodeSlug", args.targetNodeSlug).eq("kind", args.kind)).first();
    if (duplicate) return duplicate._id;
    await enforceRateLimit(ctx, userId, { key: "outcome:record", max: 20, windowMs: 86_400_000 });
    await enforceGlobalWriteLimit(ctx, "outcome:record", 200);
    const notes = args.notes
      ? sanitizeAIInput(args.notes, 500).trim() || undefined
      : undefined;
    return await ctx.db.insert("outcomeEvents", {
      userId,
      kind: args.kind,
      cvId: args.cvId,
      jobListingId: args.jobListingId,
      targetNodeSlug: args.targetNodeSlug,
      fromNodeSlug: args.fromNodeSlug,
      notes,
      occurredAt,
    });
  },
});
