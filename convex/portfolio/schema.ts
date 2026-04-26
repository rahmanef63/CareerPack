import { defineTable } from "convex/server";
import { v } from "convex/values";

export const portfolioTables = {
  portfolioItems: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    coverEmoji: v.optional(v.string()),
    coverGradient: v.optional(v.string()),
    coverStorageId: v.optional(v.string()),
    link: v.optional(v.string()),
    techStack: v.optional(v.array(v.string())),
    date: v.string(),
    featured: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_category", ["userId", "category"])
    .index("by_user_featured", ["userId", "featured"]),
};
