import { defineTable } from "convex/server";
import { v } from "convex/values";

export const financialTables = {
  financialPlans: defineTable({
    userId: v.id("users"),
    type: v.string(),
    targetLocation: v.optional(v.string()),
    currentSalary: v.optional(v.number()),
    targetSalary: v.number(),
    expenses: v.object({
      housing: v.number(),
      food: v.number(),
      transportation: v.number(),
      utilities: v.number(),
      entertainment: v.number(),
      others: v.number(),
    }),
    relocationCosts: v.optional(v.object({
      visa: v.number(),
      flights: v.number(),
      accommodation: v.number(),
      shipping: v.number(),
      emergency: v.number(),
    })),
    timeline: v.number(),
    readinessScore: v.number(),
  }).index("by_user", ["userId"]),

  budgetVariables: defineTable({
    userId: v.id("users"),
    label: v.string(),
    value: v.number(),
    iconName: v.string(),
    color: v.string(),
    order: v.number(),
    kind: v.union(
      v.literal("expense"),
      v.literal("savings"),
    ),
  })
    .index("by_user_order", ["userId", "order"])
    .index("by_user", ["userId"]),
};
