import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal query/mutation pair behind `_shared/idempotency.ts`.
 * Splitting these into a dedicated file (not `_shared/`) keeps the
 * `internal.aiIdempotency.*` reference acyclic — referencing
 * `internal.X.*` from inside `X.ts` collapses the api.d.ts type-graph
 * to `any`. The helper imports + dispatches; this module only
 * defines the DB ops.
 */

const MAX_CACHED_RESULT_LEN = 10_000;

export const _lookup = internalQuery({
  args: { userId: v.id("users"), key: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { userId, key }) => {
    const row = await ctx.db
      .query("aiIdempotency")
      .withIndex("by_user_key", (q) => q.eq("userId", userId).eq("key", key))
      .first();
    return row?.resultJson ?? null;
  },
});

export const _store = internalMutation({
  args: {
    userId: v.id("users"),
    key: v.string(),
    resultJson: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { userId, key, resultJson }) => {
    // Skip cache for results we'd never serve back (would only inflate
    // the table). Caller still sees the real value — this just
    // suppresses persistence.
    if (resultJson.length > MAX_CACHED_RESULT_LEN) return null;

    const existing = await ctx.db
      .query("aiIdempotency")
      .withIndex("by_user_key", (q) => q.eq("userId", userId).eq("key", key))
      .first();
    // First writer wins — the second concurrent action that lost the
    // race is fine to drop its store, the eventual result is the same.
    if (existing) return null;

    await ctx.db.insert("aiIdempotency", {
      userId,
      key,
      resultJson,
      createdAt: Date.now(),
    });
    return null;
  },
});
