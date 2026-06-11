import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc } from "../_shared/auth";
import { requireLen, capLen } from "../_shared/validate";

// Match the formats parseEventStart (reminders cron) expects.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^\d{2}:\d{2}$/;

function assertDate(date: string) {
  if (!ISO_DATE.test(date)) throw new Error("Tanggal harus format YYYY-MM-DD");
}
function assertTime(time: string) {
  if (!HHMM.test(time)) throw new Error("Waktu harus format HH:MM");
}

export const createEvent = mutation({
  args: {
    title: v.string(),
    date: v.string(),
    time: v.string(),
    location: v.string(),
    type: v.string(),
    notes: v.optional(v.string()),
    applicationId: v.optional(v.id("jobApplications")),
    reminderMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (args.applicationId) {
      await requireOwnedDoc(ctx, args.applicationId, "Lamaran");
    }
    assertDate(args.date);
    assertTime(args.time);
    return await ctx.db.insert("calendarEvents", {
      userId,
      title: requireLen("Judul", args.title, 200),
      date: args.date,
      time: args.time,
      location: capLen("Lokasi", args.location, 300) ?? "",
      type: requireLen("Tipe", args.type, 50),
      notes: capLen("Catatan", args.notes, 2000),
      applicationId: args.applicationId,
      reminderMinutes: args.reminderMinutes,
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
    reminderMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.eventId, "Agenda");

    const patch: Record<string, unknown> = {};
    if (args.title !== undefined) patch.title = requireLen("Judul", args.title, 200);
    if (args.date !== undefined) { assertDate(args.date); patch.date = args.date; }
    if (args.time !== undefined) { assertTime(args.time); patch.time = args.time; }
    if (args.location !== undefined) patch.location = capLen("Lokasi", args.location, 300) ?? "";
    if (args.type !== undefined) patch.type = requireLen("Tipe", args.type, 50);
    if (args.notes !== undefined) patch.notes = capLen("Catatan", args.notes, 2000);
    if (args.reminderMinutes !== undefined) patch.reminderMinutes = args.reminderMinutes;

    // Reschedule clears the idempotency flag so the cron can re-fire.
    if (
      args.date !== undefined ||
      args.time !== undefined ||
      args.reminderMinutes !== undefined
    ) {
      patch.reminderSentAt = undefined;
    }

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
