import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
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
    // Capped — every item costs one `ctx.storage.getUrl` per media
    // entry, so an unbounded list is the most expensive read in the app.
    const items = await ctx.db
      .query("portfolioItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(500);
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

// ---------------------------------------------------------------------------
// MCP (convex/mcp/tools/portfolio.ts). `optionalUser` returns null in an MCP
// request — no @convex-dev/auth session — so the user id arrives as an
// explicit arg resolved from the bearer token and scopes the `by_user` read.
// ---------------------------------------------------------------------------

export const mcpList = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("portfolioItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(200);
    return {
      items: items.map((i) => ({
        item_id: i._id,
        title: i.title,
        description: i.description,
        category: i.category,
        date: i.date,
        featured: i.featured,
        link: i.link ?? null,
        links: (i.links ?? []).map((l) => ({ url: l.url, label: l.label, kind: l.kind })),
        tech_stack: i.techStack ?? [],
        role: i.role ?? null,
        client: i.client ?? null,
        duration: i.duration ?? null,
        outcomes: i.outcomes ?? [],
        skills: i.skills ?? [],
        // Count, not ids: a storage id is a capability token in this app
        // (convex/files/ownership.ts) and must not land in a third party's
        // transcript. It would also be useless to the model — resolving one
        // needs an upload/download round-trip an MCP client cannot make.
        media_count: (i.media ?? []).length,
      })),
      total: items.length,
    };
  },
});
