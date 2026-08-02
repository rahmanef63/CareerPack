import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { optionalUser } from "../_shared/auth";

export const listContacts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    // Newest-first + capped — see applications/queries.ts.
    return await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1000);
  },
});

// ---------------------------------------------------------------------------
// MCP (convex/mcp/tools/contacts.ts). `optionalUser` returns null in an MCP
// request — no @convex-dev/auth session — so the user id arrives as an
// explicit arg resolved from the bearer token and scopes the `by_user` read.
// ---------------------------------------------------------------------------

export const mcpList = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(300);
    return {
      items: rows.map((c) => ({
        contact_id: c._id,
        name: c.name,
        role: c.role,
        company: c.company ?? null,
        position: c.position ?? null,
        // The catalog rule against returning raw email exists to keep the
        // *account holder's* identity out of a third party's transcript.
        // This is the address book the user asked the assistant to work
        // from — withholding it would leave every "draft a note to my
        // recruiter" request unanswerable.
        email: c.email ?? null,
        phone: c.phone ?? null,
        linkedin_url: c.linkedinUrl ?? null,
        notes: c.notes ?? null,
        favorite: c.favorite,
        last_interaction: c.lastInteraction
          ? new Date(c.lastInteraction).toISOString()
          : null,
      })),
      total: rows.length,
    };
  },
});
