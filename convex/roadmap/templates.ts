import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, optionalUser } from "../_shared/auth";

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
        isSystem: t.isSystem,
        authorName: t.authorName ?? null,
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

/** Publish user's personal roadmap as a community template. */
export const publishMyRoadmap = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    domain: v.string(),
    icon: v.string(),
    color: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
    nodes: v.array(v.object({
      id: v.string(),
      title: v.string(),
      description: v.string(),
      difficulty: v.string(),
      estimatedHours: v.number(),
      prerequisites: v.array(v.string()),
      parentId: v.optional(v.string()),
      category: v.optional(v.string()),
      resources: v.array(v.object({
        id: v.string(),
        title: v.string(),
        type: v.string(),
        url: v.string(),
        free: v.boolean(),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    // Prevent slug collision
    const existing = await ctx.db
      .query("roadmapTemplates")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) throw new Error("Slug sudah digunakan, pilih nama lain");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const authorName = profile?.fullName ?? "Pengguna";

    const id = await ctx.db.insert("roadmapTemplates", {
      ...args,
      isPublic: true,
      isSystem: false,
      order: 9999,
      authorId: userId,
      authorName,
    });
    return id;
  },
});

/** List templates authored by the current user. */
export const listMyTemplates = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    const all = await ctx.db.query("roadmapTemplates").collect();
    return all
      .filter((t) => t.authorId === userId)
      .sort((a, b) => a._creationTime - b._creationTime);
  },
});

/** Delete a template authored by the current user. */
export const deleteMyTemplate = mutation({
  args: { id: v.id("roadmapTemplates") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const tpl = await ctx.db.get(id);
    if (!tpl) throw new Error("Template tidak ditemukan");
    if (tpl.authorId !== userId) throw new Error("Tidak diizinkan");
    await ctx.db.delete(id);
  },
});
