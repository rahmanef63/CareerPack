import { defineTable } from "convex/server";
import { v } from "convex/values";

export const calendarTables = {
  calendarEvents: defineTable({
    userId: v.id("users"),
    title: v.string(),
    date: v.string(),
    time: v.string(),
    location: v.string(),
    type: v.string(),
    notes: v.optional(v.string()),
    applicationId: v.optional(v.id("jobApplications")),
    // Minutes before event start to fire a reminder notification.
    // Undefined = no reminder. Common values: 15, 60, 1440 (1 day).
    reminderMinutes: v.optional(v.number()),
    // Set when the reminder cron has already inserted a notification
    // for this event. Cleared if the user reschedules. Idempotency key.
    reminderSentAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"])
    .index("by_user_application", ["userId", "applicationId"])
    .index("by_date", ["date"])
    /** Reminder sweep — lets `reminders.sweepReminders` window ONLY the
     *  events that still need one: not yet notified (`reminderSentAt`
     *  unset) AND actually asking for a reminder (`reminderMinutes` set;
     *  `undefined` sorts below every number, so a `>= 0` bound drops
     *  them). A plain `by_date` window kept re-reading rows it had
     *  already handled, so a busy day starved its tail forever. */
    .index("by_date_reminder", ["date", "reminderSentAt", "reminderMinutes"]),
};
