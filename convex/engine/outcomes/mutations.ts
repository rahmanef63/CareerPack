import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireUser } from "../../_shared/auth";
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
 * Append a single outcome event. Append-only by design — the same
 * `(user, jobListing, kind)` may legitimately occur multiple times
 * (re-apply after rejection, two interview rounds, etc.), so no
 * dedup is performed. Notes are sanitised to prevent prompt injection
 * if this data ever feeds an AI summariser later.
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
      occurredAt: args.occurredAt ?? Date.now(),
    });
  },
});
