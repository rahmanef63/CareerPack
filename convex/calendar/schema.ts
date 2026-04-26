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
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),
};
