import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc } from "../_shared/auth";

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
    coverStorageId: v.optional(v.string()),
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
      coverStorageId: args.coverStorageId,
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
    coverStorageId: v.optional(v.string()),
    clearCover: v.optional(v.boolean()),
    link: v.optional(v.string()),
    techStack: v.optional(v.array(v.string())),
    date: v.optional(v.string()),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { itemId, clearCover, ...rest } = args;
    await requireOwnedDoc(ctx, itemId, "Portofolio");
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) patch[k] = v;
    }
    if (clearCover) patch.coverStorageId = undefined;
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
