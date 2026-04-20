import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { optionalUser, requireUser, requireOwnedDoc } from "./_lib/auth";

export const listPortfolio = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("portfolioItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const createPortfolioItem = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("project"),
      v.literal("certification"),
      v.literal("publication"),
    ),
    coverEmoji: v.optional(v.string()),
    coverGradient: v.optional(v.string()),
    link: v.optional(v.string()),
    techStack: v.optional(v.array(v.string())),
    date: v.string(),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await ctx.db.insert("portfolioItems", {
      userId,
      title: args.title,
      description: args.description,
      category: args.category,
      coverEmoji: args.coverEmoji,
      coverGradient: args.coverGradient,
      link: args.link,
      techStack: args.techStack ?? [],
      date: args.date,
      featured: args.featured ?? false,
    });
  },
});

export const updatePortfolioItem = mutation({
  args: {
    itemId: v.id("portfolioItems"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("project"),
        v.literal("certification"),
        v.literal("publication"),
      ),
    ),
    coverEmoji: v.optional(v.string()),
    coverGradient: v.optional(v.string()),
    link: v.optional(v.string()),
    techStack: v.optional(v.array(v.string())),
    date: v.optional(v.string()),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { itemId, ...rest } = args;
    await requireOwnedDoc(ctx, itemId, "Portofolio");
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) patch[k] = v;
    }
    await ctx.db.patch(itemId, patch);
  },
});

export const deletePortfolioItem = mutation({
  args: { itemId: v.id("portfolioItems") },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.itemId, "Portofolio");
    await ctx.db.delete(args.itemId);
  },
});

export const togglePortfolioFeatured = mutation({
  args: { itemId: v.id("portfolioItems") },
  handler: async (ctx, args) => {
    const item = await requireOwnedDoc(ctx, args.itemId, "Portofolio");
    await ctx.db.patch(args.itemId, { featured: !item.featured });
  },
});
