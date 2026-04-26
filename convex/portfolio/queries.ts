import { query } from "../_generated/server";
import { optionalUser } from "../_shared/auth";

export const listPortfolio = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    const items = await ctx.db
      .query("portfolioItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return await Promise.all(
      items.map(async (item) => ({
        ...item,
        coverUrl: item.coverStorageId
          ? await ctx.storage.getUrl(item.coverStorageId)
          : null,
      })),
    );
  },
});
