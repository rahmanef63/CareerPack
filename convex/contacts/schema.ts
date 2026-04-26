import { defineTable } from "convex/server";
import { v } from "convex/values";

export const contactsTables = {
  contacts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    role: v.string(),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    avatarEmoji: v.optional(v.string()),
    avatarHue: v.optional(v.string()),
    lastInteraction: v.optional(v.number()),
    favorite: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_role", ["userId", "role"])
    .index("by_user_last", ["userId", "lastInteraction"]),
};
