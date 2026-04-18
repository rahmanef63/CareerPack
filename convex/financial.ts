import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { optionalUser, requireUser } from "./_lib/auth";

export const getUserFinancialPlan = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("financialPlans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const createOrUpdateFinancialPlan = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const totalExpenses = Object.values(args.expenses).reduce((sum, exp) => sum + exp, 0);
    const monthlyNet = args.targetSalary / 12 - totalExpenses;
    const relocationCosts = args.relocationCosts
      ? Object.values(args.relocationCosts).reduce((sum, cost) => sum + cost, 0)
      : 0;
    const emergencyFund = totalExpenses * 6;
    const totalNeeded = relocationCosts + emergencyFund;

    let readinessScore = 0;
    if (monthlyNet > 0) {
      const monthsToSave = totalNeeded / monthlyNet;
      if (monthsToSave <= args.timeline) readinessScore = 100;
      else if (monthsToSave <= args.timeline * 1.5) readinessScore = 75;
      else if (monthsToSave <= args.timeline * 2) readinessScore = 50;
      else readinessScore = 25;
    }

    const existing = await ctx.db
      .query("financialPlans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const planData = {
      userId,
      type: args.type,
      targetLocation: args.targetLocation,
      currentSalary: args.currentSalary,
      targetSalary: args.targetSalary,
      expenses: args.expenses,
      relocationCosts: args.relocationCosts,
      timeline: args.timeline,
      readinessScore,
    };

    if (existing) {
      await ctx.db.patch(existing._id, planData);
      return existing._id;
    }
    return await ctx.db.insert("financialPlans", planData);
  },
});
