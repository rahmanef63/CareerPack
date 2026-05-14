import { v } from "convex/values";
import { query } from "../_generated/server";
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
