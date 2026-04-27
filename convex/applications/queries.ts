import { query } from "../_generated/server";
import { v } from "convex/values";
import { optionalUser, requireOwnedDoc } from "../_shared/auth";

export const getUserApplications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("jobApplications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

/**
 * Reverse relation: calendar events scheduled for this application
 * (interview slots, follow-ups, etc.). Powers the application detail
 * drawer's "Agenda terkait" panel.
 */
export const getCalendarEventsByApplication = query({
  args: { applicationId: v.id("jobApplications") },
  handler: async (ctx, args) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    await requireOwnedDoc(ctx, args.applicationId, "Lamaran");
    return await ctx.db
      .query("calendarEvents")
      .withIndex("by_user_application", (q) =>
        q.eq("userId", userId).eq("applicationId", args.applicationId),
      )
      .collect();
  },
});
