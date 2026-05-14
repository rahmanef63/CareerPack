import { v } from "convex/values";
import { query } from "../../_generated/server";
import { optionalUser } from "../../_shared/auth";

/**
 * Active Career Quest for the calling user. At MVP one quest at a
 * time — newest active row wins. Returns null when no active quest
 * exists.
 */
export const myActiveQuest = query({
  args: {},
  returns: v.union(v.null(), v.any()),
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return null;
    const row = await ctx.db
      .query("careerQuests")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", "active"),
      )
      .order("desc")
      .first();
    return row;
  },
});

/** History of all quests for the calling user. */
export const myQuests = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.any()),
  handler: async (ctx, { limit }) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("careerQuests")
      .withIndex("by_user_time", (q) => q.eq("userId", userId))
      .order("desc")
      .take(Math.min(Math.max(limit ?? 20, 1), 100));
    return rows;
  },
});
