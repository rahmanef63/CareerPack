import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserApplications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("jobApplications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const application = await ctx.db.get(args.applicationId);
    if (!application || application.userId !== userId) {
      throw new Error("Application not found or access denied");
    }

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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const application = await ctx.db.get(args.applicationId);
    if (!application || application.userId !== userId) {
      throw new Error("Application not found or access denied");
    }

    const newInterview = {
      type: args.type,
      date: args.date,
      notes: args.notes,
    };

    await ctx.db.patch(args.applicationId, {
      interviewDates: [...application.interviewDates, newInterview],
    });
  },
});

export const deleteApplication = mutation({
  args: { applicationId: v.id("jobApplications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const application = await ctx.db.get(args.applicationId);
    if (!application || application.userId !== userId) {
      throw new Error("Application not found or access denied");
    }

    await ctx.db.delete(args.applicationId);
  },
});
