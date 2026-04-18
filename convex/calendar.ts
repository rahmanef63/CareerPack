import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listEvents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("calendarEvents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("asc")
      .collect();
  },
});

export const createEvent = mutation({
  args: {
    title: v.string(),
    date: v.string(),
    time: v.string(),
    location: v.string(),
    type: v.string(),
    notes: v.optional(v.string()),
    applicationId: v.optional(v.id("jobApplications")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Tidak terautentikasi");

    return await ctx.db.insert("calendarEvents", {
      userId,
      title: args.title,
      date: args.date,
      time: args.time,
      location: args.location,
      type: args.type,
      notes: args.notes,
      applicationId: args.applicationId,
    });
  },
});

export const updateEvent = mutation({
  args: {
    eventId: v.id("calendarEvents"),
    title: v.optional(v.string()),
    date: v.optional(v.string()),
    time: v.optional(v.string()),
    location: v.optional(v.string()),
    type: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Tidak terautentikasi");

    const existing = await ctx.db.get(args.eventId);
    if (!existing || existing.userId !== userId) {
      throw new Error("Agenda tidak ditemukan atau bukan milik Anda");
    }

    const patch: Record<string, unknown> = {};
    if (args.title !== undefined) patch.title = args.title;
    if (args.date !== undefined) patch.date = args.date;
    if (args.time !== undefined) patch.time = args.time;
    if (args.location !== undefined) patch.location = args.location;
    if (args.type !== undefined) patch.type = args.type;
    if (args.notes !== undefined) patch.notes = args.notes;

    await ctx.db.patch(args.eventId, patch);
  },
});

export const deleteEvent = mutation({
  args: { eventId: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Tidak terautentikasi");

    const existing = await ctx.db.get(args.eventId);
    if (!existing || existing.userId !== userId) {
      throw new Error("Agenda tidak ditemukan atau bukan milik Anda");
    }
    await ctx.db.delete(args.eventId);
  },
});
