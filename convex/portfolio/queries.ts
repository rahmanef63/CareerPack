import { query } from "../_generated/server";
import { optionalUser } from "../_shared/auth";

/**
 * Returns the user's portfolio items with all media URLs resolved.
 * - `coverUrl` (legacy single cover) — kept for old PortfolioCard
 *   renderers; equals `media[0].url` when both are set.
 * - `media[].url` (new) — populated for every gallery item so the
 *   detail dialog can render a full carousel without N round-trips.
 */
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
      items.map(async (item) => {
        const coverUrl = item.coverStorageId
          ? await ctx.storage.getUrl(item.coverStorageId)
          : null;
        const media = item.media
          ? await Promise.all(
              item.media.map(async (m) => ({
                ...m,
                url: await ctx.storage.getUrl(m.storageId),
              })),
            )
          : [];
        return { ...item, coverUrl, media };
      }),
    );
  },
});
