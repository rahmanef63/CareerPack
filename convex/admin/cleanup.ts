import { internalMutation } from "../_generated/server";
import { cascadeDeleteUser } from "./mutations";

const DAY = 24 * 60 * 60 * 1000;
const PRUNE_BATCH_MAX = 1000;

/**
 * Daily cron target. Removes anonymous users (no email) older than 7
 * days, capped at 50 per run. See convex/crons.ts for the schedule.
 */
export const cleanupInactiveDemoUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 7 * DAY;
    const allUsers = await ctx.db.query("users").collect();
    const stale = allUsers.filter(
      (u) => !u.email && u._creationTime < cutoff,
    );
    const batch = stale.slice(0, 50);
    for (const u of batch) {
      await cascadeDeleteUser(ctx, u._id);
    }
    return { scanned: allUsers.length, candidates: stale.length, deleted: batch.length };
  },
});

/**
 * Append-only logs prune. Each table is bounded by:
 *
 * - `errorLogs`             — 90 days. Long enough for "did the bug
 *                             appear last quarter?" forensics; short
 *                             enough the table doesn't grow without
 *                             bound. Admin can clear sooner via
 *                             ErrorLogsPanel.
 * - `rateLimitEvents`       — 7 days. Quota check window is 1 day, so
 *                             7 days gives slack for forensics
 *                             ("user X spammed yesterday") without
 *                             retaining data the live path skips.
 * - `passwordResetIpEvents` — 1 day. Per-IP bucket window is 1 hour,
 *                             so anything older is dead weight.
 * - `loginCheckIpEvents`    — 1 day. Same shape + window as the
 *                             password-reset bucket.
 * - `aiIdempotency`         — 30 minutes. Cache lifetime exists only
 *                             to dedupe retries; older rows are dead.
 * - `passwordResetTokens`   — `used` rows or expired rows are
 *                             immediately safe to drop. Active unused
 *                             tokens kept.
 *
 * All capped at PRUNE_BATCH_MAX deletes per run so the cron tick
 * always finishes within Convex's mutation budget. Pruner re-runs
 * daily — a backlog clears in days, not minutes.
 */
export const pruneAppendOnlyTables = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const stats = {
      errorLogs: 0,
      rateLimitEvents: 0,
      passwordResetIpEvents: 0,
      loginCheckIpEvents: 0,
      aiIdempotency: 0,
      passwordResetTokens: 0,
    };

    // errorLogs > 90 days — uses by_time index for cheap range query.
    {
      const cutoff = now - 90 * DAY;
      const stale = await ctx.db
        .query("errorLogs")
        .withIndex("by_time", (q) => q.lt("timestamp", cutoff))
        .take(PRUNE_BATCH_MAX);
      for (const r of stale) await ctx.db.delete(r._id);
      stats.errorLogs = stale.length;
    }

    // rateLimitEvents > 7 days. No global by_time index; the
    // by_user_key_time index requires (userId, key) prefix. Take a
    // generous slice and filter in-mem; cap is the floor on growth so
    // collect() never spikes memory.
    {
      const cutoff = now - 7 * DAY;
      const stale = (
        await ctx.db.query("rateLimitEvents").take(PRUNE_BATCH_MAX * 2)
      ).filter((e) => e.timestamp < cutoff);
      const batch = stale.slice(0, PRUNE_BATCH_MAX);
      for (const r of batch) await ctx.db.delete(r._id);
      stats.rateLimitEvents = batch.length;
    }

    // passwordResetIpEvents > 1 day
    {
      const cutoff = now - DAY;
      const stale = (
        await ctx.db.query("passwordResetIpEvents").take(PRUNE_BATCH_MAX * 2)
      ).filter((e) => e.timestamp < cutoff);
      const batch = stale.slice(0, PRUNE_BATCH_MAX);
      for (const r of batch) await ctx.db.delete(r._id);
      stats.passwordResetIpEvents = batch.length;
    }

    // loginCheckIpEvents > 1 day — same pattern as passwordResetIpEvents.
    {
      const cutoff = now - DAY;
      const stale = (
        await ctx.db.query("loginCheckIpEvents").take(PRUNE_BATCH_MAX * 2)
      ).filter((e) => e.timestamp < cutoff);
      const batch = stale.slice(0, PRUNE_BATCH_MAX);
      for (const r of batch) await ctx.db.delete(r._id);
      stats.loginCheckIpEvents = batch.length;
    }

    // aiIdempotency > 30 minutes — uses by_createdAt for cheap range.
    {
      const cutoff = now - 30 * 60 * 1000;
      const stale = await ctx.db
        .query("aiIdempotency")
        .withIndex("by_createdAt", (q) => q.lt("createdAt", cutoff))
        .take(PRUNE_BATCH_MAX);
      for (const r of stale) await ctx.db.delete(r._id);
      stats.aiIdempotency = stale.length;
    }

    // passwordResetTokens — used or expired (TTL 30m, so anything
    // expired now is consumed/abandoned).
    {
      const stale = (
        await ctx.db.query("passwordResetTokens").take(PRUNE_BATCH_MAX * 2)
      ).filter((t) => Boolean(t.usedAt) || t.expiresAt < now);
      const batch = stale.slice(0, PRUNE_BATCH_MAX);
      for (const r of batch) await ctx.db.delete(r._id);
      stats.passwordResetTokens = batch.length;
    }

    return stats;
  },
});
