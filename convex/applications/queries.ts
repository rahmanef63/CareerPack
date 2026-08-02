import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { optionalUser, requireOwnedDoc } from "../_shared/auth";
import type { Doc } from "../_generated/dataModel";

export const getUserApplications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    // Newest-first + capped: reactive query, so an unbounded collect
    // re-pushes the user's whole application history on every write.
    return await ctx.db
      .query("jobApplications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1000);
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

// ---------------------------------------------------------------------------
// MCP (convex/mcp/tools/applications.ts). `optionalUser` returns null in an
// MCP request — there is no @convex-dev/auth session — so the user id arrives
// as an explicit arg resolved from the bearer token, and the `by_user*`
// indexes are what scope the read. Never a full-table collect + filter.
// ---------------------------------------------------------------------------

/** Only the fields worth spending a model's context on. `documents` is a bag
 *  of opaque ids the model can do nothing with, so it is dropped. */
function mcpSummarise(a: Doc<"jobApplications">) {
  return {
    application_id: a._id,
    company: a.company,
    position: a.position,
    location: a.location,
    status: a.status,
    source: a.source,
    salary: a.salary ?? null,
    notes: a.notes ?? null,
    applied_date: new Date(a.appliedDate).toISOString(),
    cv_id: a.cvId ?? null,
    interview_dates: a.interviewDates.map((i) => ({
      type: i.type,
      date: new Date(i.date).toISOString(),
      notes: i.notes ?? null,
    })),
  };
}

export const mcpList = internalQuery({
  args: { userId: v.id("users"), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const status = args.status;
    // Newest-first and capped: an unbounded read of a heavy tracker would
    // blow the model's context long before it ran out of rows.
    const rows = status
      ? await ctx.db
          .query("jobApplications")
          .withIndex("by_user_status", (q) =>
            q.eq("userId", args.userId).eq("status", status),
          )
          .order("desc")
          .take(200)
      : await ctx.db
          .query("jobApplications")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .order("desc")
          .take(200);
    return { items: rows.map(mcpSummarise), total: rows.length };
  },
});
