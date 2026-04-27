import { mutation, type MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc } from "../_shared/auth";
import type { Id } from "../_generated/dataModel";

/**
 * Cascade-clean FKs that point at this application. `calendarEvents`
 * keeps the event row but unsets `applicationId` so the user still
 * sees the booked slot in their agenda — they only lose the link
 * back to the (now-deleted) application row.
 */
async function cascadeRemoveApplication(
  ctx: MutationCtx,
  userId: Id<"users">,
  applicationId: Id<"jobApplications">,
) {
  const events = await ctx.db
    .query("calendarEvents")
    .withIndex("by_user_application", (q) =>
      q.eq("userId", userId).eq("applicationId", applicationId),
    )
    .collect();
  for (const e of events) await ctx.db.patch(e._id, { applicationId: undefined });
}

export const createApplication = mutation({
  args: {
    company: v.string(),
    position: v.string(),
    location: v.string(),
    salary: v.optional(v.string()),
    source: v.string(),
    notes: v.optional(v.string()),
    /** Optional FK to the CV used. Validated for ownership when provided. */
    cvId: v.optional(v.id("cvs")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (args.cvId) {
      // Ownership check — `requireOwnedDoc` throws "CV tidak ditemukan"
      // on a foreign id, which is the same surface as a deleted row.
      await requireOwnedDoc(ctx, args.cvId, "CV");
    }
    return await ctx.db.insert("jobApplications", {
      userId,
      cvId: args.cvId,
      company: args.company,
      position: args.position,
      location: args.location,
      salary: args.salary,
      status: "applied",
      appliedDate: Date.now(),
      source: args.source,
      notes: args.notes,
      interviewDates: [],
      documents: [],
    });
  },
});

export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("jobApplications"),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const application = await requireOwnedDoc(ctx, args.applicationId, "Lamaran");
    await ctx.db.patch(args.applicationId, {
      status: args.status,
      notes: args.notes || application.notes,
    });
  },
});

export const addInterviewDate = mutation({
  args: {
    applicationId: v.id("jobApplications"),
    type: v.string(),
    date: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const application = await requireOwnedDoc(ctx, args.applicationId, "Lamaran");
    await ctx.db.patch(args.applicationId, {
      interviewDates: [
        ...application.interviewDates,
        { type: args.type, date: args.date, notes: args.notes },
      ],
    });
  },
});

export const deleteApplication = mutation({
  args: { applicationId: v.id("jobApplications") },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.applicationId, "Lamaran");
    const userId = await requireUser(ctx);
    await cascadeRemoveApplication(ctx, userId, args.applicationId);
    await ctx.db.delete(args.applicationId);
  },
});

export const bulkDeleteApplications = mutation({
  args: { ids: v.array(v.id("jobApplications")) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    let deleted = 0;
    for (const id of args.ids) {
      await requireOwnedDoc(ctx, id, "Lamaran");
      await cascadeRemoveApplication(ctx, userId, id);
      await ctx.db.delete(id);
      deleted++;
    }
    return { deleted };
  },
});
