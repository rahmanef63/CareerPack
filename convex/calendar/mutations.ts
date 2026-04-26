import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc } from "../_shared/auth";

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
    const userId = await requireUser(ctx);
    if (args.applicationId) {
      await requireOwnedDoc(ctx, args.applicationId, "Lamaran");
    }
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
    await requireOwnedDoc(ctx, args.eventId, "Agenda");

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
    await requireOwnedDoc(ctx, args.eventId, "Agenda");
    await ctx.db.delete(args.eventId);
  },
});
