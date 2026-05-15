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

/**
 * Per-action-type efficacy stats (user-scoped). Aggregates the user's
 * own quest action completion telemetry — Phase 4.5 lite. The engine
 * surfaces these in QuestPanel so users can self-reflect which action
 * categories they actually follow through on. No cross-user data, no
 * DP needed.
 */
export const myActionEfficacy = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    const quests = await ctx.db
      .query("careerQuests")
      .withIndex("by_user_time", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100);

    interface Bucket {
      attempted: number;
      completed: number;
      totalDays: number;
      timedSamples: number;
    }
    const agg = new Map<string, Bucket>();
    for (const quest of quests) {
      for (const a of quest.actions) {
        const cur = agg.get(a.type) ?? {
          attempted: 0,
          completed: 0,
          totalDays: 0,
          timedSamples: 0,
        };
        cur.attempted += 1;
        if (a.completed && typeof a.completedAt === "number") {
          cur.completed += 1;
          const days = (a.completedAt - quest.createdAt) / 86_400_000;
          if (days >= 0 && Number.isFinite(days)) {
            cur.totalDays += days;
            cur.timedSamples += 1;
          }
        }
        agg.set(a.type, cur);
      }
    }
    return Array.from(agg.entries())
      .map(([type, s]) => ({
        type,
        attempted: s.attempted,
        completed: s.completed,
        completionRate:
          s.attempted === 0 ? 0 : s.completed / s.attempted,
        avgDaysToComplete:
          s.timedSamples === 0 ? null : s.totalDays / s.timedSamples,
      }))
      .sort((a, b) => b.attempted - a.attempted);
  },
});
