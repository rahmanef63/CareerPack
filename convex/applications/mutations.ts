import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc } from "../_shared/auth";

export const createApplication = mutation({
  args: {
    company: v.string(),
    position: v.string(),
    location: v.string(),
    salary: v.optional(v.string()),
    source: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await ctx.db.insert("jobApplications", {
      userId,
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
    await ctx.db.delete(args.applicationId);
  },
});
