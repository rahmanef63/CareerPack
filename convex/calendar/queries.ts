import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { optionalUser } from "../_shared/auth";

/** Ceiling on events returned to the client. Reactive query — an
 *  unbounded `.collect()` re-pushes the user's entire calendar history
 *  on every write. Reads newest-first then restores the ascending order
 *  callers expect, so the cap drops the oldest rows, never new ones. */
const MAX_EVENTS = 2000;

export const listEvents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("calendarEvents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(MAX_EVENTS);
    return rows.reverse();
  },
});

// ---------------------------------------------------------------------------
// MCP (convex/mcp/tools/calendar.ts). `optionalUser` returns null in an MCP
// request — no @convex-dev/auth session — so the user id arrives as an
// explicit arg resolved from the bearer token.
// ---------------------------------------------------------------------------

/** Cap for the MCP read. Far below MAX_EVENTS: "what is on my calendar" only
 *  ever means the next few weeks, and a year of agenda would crowd out the
 *  rest of the model's context for no benefit. */
const MCP_MAX_EVENTS = 200;

export const mcpListEvents = internalQuery({
  args: {
    userId: v.id("users"),
    from: v.optional(v.string()),
    to: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // `date` is a YYYY-MM-DD string, so a lexicographic range on the
    // `by_user_date` index is also a chronological one — the window is
    // applied by the index, not by reading everything and filtering.
    const rows = await ctx.db
      .query("calendarEvents")
      .withIndex("by_user_date", (q) => {
        const scoped = q.eq("userId", args.userId);
        if (args.from !== undefined && args.to !== undefined) {
          return scoped.gte("date", args.from).lte("date", args.to);
        }
        if (args.from !== undefined) return scoped.gte("date", args.from);
        if (args.to !== undefined) return scoped.lte("date", args.to);
        return scoped;
      })
      .take(MCP_MAX_EVENTS);
    return {
      items: rows.map((e) => ({
        event_id: e._id,
        title: e.title,
        date: e.date,
        time: e.time,
        location: e.location,
        type: e.type,
        notes: e.notes ?? null,
        application_id: e.applicationId ?? null,
        reminder_minutes: e.reminderMinutes ?? null,
      })),
      total: rows.length,
    };
  },
});
