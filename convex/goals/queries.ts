import { query } from "../_generated/server";
import { optionalUser } from "../_shared/auth";

export const getUserGoals = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("careerGoals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});
