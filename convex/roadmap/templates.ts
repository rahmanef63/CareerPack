import { query } from "../_generated/server";
import { v } from "convex/values";

export const listPublicTemplates = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("roadmapTemplates").collect();
    return all
      .filter((t) => t.isPublic)
      .sort((a, b) => a.order - b.order)
      .map((t) => ({
        _id: t._id,
        title: t.title,
        slug: t.slug,
        domain: t.domain,
        icon: t.icon,
        color: t.color,
        description: t.description,
        tags: t.tags,
        order: t.order,
        nodeCount: t.nodes.length,
        totalHours: t.nodes.reduce((s, n) => s + n.estimatedHours, 0),
      }));
  },
});

export const getTemplateBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db
      .query("roadmapTemplates")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
  },
});

export const getTemplateById = query({
  args: { id: v.id("roadmapTemplates") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});
