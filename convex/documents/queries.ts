import { v } from "convex/values";
import { query, internalQuery } from "../_generated/server";
import { optionalUser } from "../_shared/auth";

export const getUserDocumentChecklist = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("documentChecklists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

/**
 * Public — list seeded country document templates for the picker
 * UI. Returns light projection (no full document list) for the
 * grid; full template is fetched lazily by `getTemplateByCountry`.
 */
export const listTemplates = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const rows = await ctx.db.query("documentTemplates").take(50);
    return rows
      .map((r) => ({
        _id: r._id,
        country: r.country,
        countryLabel: r.countryLabel,
        flag: r.flag,
        description: r.description,
        documentCount: r.documents.length,
        requiredCount: r.documents.filter((d) => d.required).length,
      }))
      .sort((a, b) => a.countryLabel.localeCompare(b.countryLabel));
  },
});

/** Full template payload for a single country — for the preview dialog. */
export const getTemplateByCountry = query({
  args: { country: v.string() },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, { country }) => {
    const row = await ctx.db
      .query("documentTemplates")
      .withIndex("by_country", (q) => q.eq("country", country))
      .first();
    return row;
  },
});

// ---------------------------------------------------------------------------
// MCP (convex/mcp/tools/documents.ts). `optionalUser` returns null in an MCP
// request — no @convex-dev/auth session — so the user id arrives as an
// explicit arg resolved from the bearer token.
// ---------------------------------------------------------------------------

export const mcpGetChecklist = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const checklist = await ctx.db
      .query("documentChecklists")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!checklist) return null;
    return {
      country: checklist.country ?? null,
      type: checklist.type,
      progress: checklist.progress,
      // `document_id` is the template-scoped string key, not a Convex row id
      // — it is what documents_set_status takes.
      items: checklist.documents.map((d) => ({
        document_id: d.id,
        name: d.name,
        category: d.category,
        subcategory: d.subcategory ?? null,
        required: d.required,
        completed: d.completed,
        notes: d.notes,
        expiry_date: d.expiryDate ?? null,
      })),
    };
  },
});

/**
 * No `userId`: `documentTemplates` is the shared, admin-seeded country
 * master list, not user data. The MCP handler still runs behind a resolved
 * bearer, so this is not reachable unauthenticated.
 */
export const mcpListCountryTemplates = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("documentTemplates").take(50);
    return {
      items: rows
        .map((r) => ({
          country: r.country,
          label: r.countryLabel,
          description: r.description ?? null,
          document_count: r.documents.length,
          required_count: r.documents.filter((d) => d.required).length,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    };
  },
});
