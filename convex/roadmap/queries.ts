import { query } from "../_generated/server";
import { optionalUser } from "../_shared/auth";

export const getUserRoadmap = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("skillRoadmaps")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});
