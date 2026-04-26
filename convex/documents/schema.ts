import { defineTable } from "convex/server";
import { v } from "convex/values";

export const documentsTables = {
  documentChecklists: defineTable({
    userId: v.id("users"),
    type: v.string(),
    country: v.optional(v.string()),
    documents: v.array(v.object({
      id: v.string(),
      name: v.string(),
      category: v.string(),
      subcategory: v.optional(v.string()),
      required: v.boolean(),
      completed: v.boolean(),
      notes: v.string(),
      expiryDate: v.optional(v.string()),
    })),
    progress: v.number(),
  }).index("by_user", ["userId"]),
};
