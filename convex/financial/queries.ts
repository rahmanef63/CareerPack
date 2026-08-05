import { query } from "../_generated/server";
import { optionalUser } from "../_shared/auth";

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

export const listBudgetVariables = query({
  args: {},
  handler: async (ctx) => {
    // List query — `optionalUser` so logging out while on the Kalkulator page
    // renders empty instead of throwing to the error boundary.
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("budgetVariables")
      .withIndex("by_user_order", (q) => q.eq("userId", userId))
      .collect();
    return rows.sort((a, b) => a.order - b.order);
  },
});
