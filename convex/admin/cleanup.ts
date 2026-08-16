import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { cascadeDeleteUser } from "./mutations";

const DAY = 24 * 60 * 60 * 1000;
const PRUNE_BATCH_MAX = 1000;
/** Candidate window per run. `users` scans oldest-first, which is
 *  exactly where stale demo accounts sit, so a bounded head-scan finds
 *  them without reading the whole table. */
const USER_SCAN_CAP = 1000;
const DEMO_DELETE_BATCH = 50;

/**
 * Daily cron target. Removes anonymous users (no email) older than 7
 * days, capped at 50 per run. See convex/crons.ts for the schedule.
 *
 * Each cascade runs as its OWN scheduled mutation: doing all 50 inline
 * meant one heavy account blew the transaction budget and rolled back
 * the entire batch, so nothing was ever deleted and the same candidates
 * were re-picked every night while the cron reported success.
 */
export const cleanupInactiveDemoUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 7 * DAY;
    const scanned = await ctx.db.query("users").take(USER_SCAN_CAP);
    const stale = scanned.filter((u) => !u.email && u._creationTime < cutoff);
    const batch = stale.slice(0, DEMO_DELETE_BATCH);
    for (const u of batch) {
      await ctx.scheduler.runAfter(0, internal.admin.cleanup._cascadeDeleteDemoUser, {
        userId: u._id,
      });
    }
    return { scanned: scanned.length, candidates: stale.length, scheduled: batch.length };
  },
});

/** One anonymous account, one transaction. Re-checks the guard because
 *  the account could have signed up (gained an email) between the sweep
 *  and this scheduled run. */
export const _cascadeDeleteDemoUser = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user || user.email) return;
    await cascadeDeleteUser(ctx, userId);
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
 * - `oauthRegisterIpEvents` — 1 day. Same again, for the unauthenticated
 *                             RFC 7591 registration endpoint.
 * - `aiIdempotency`         — 30 minutes. Cache lifetime exists only
 *                             to dedupe retries; older rows are dead.
 * - `passwordResetTokens`   — `used` rows or expired rows are
 *                             immediately safe to drop. Active unused
 *                             tokens kept.
 * - `oauthCodes`            — consumed or expired. Exchange marks a code
 *                             `consumed: true` rather than deleting it, and
 *                             nothing deleted it afterwards, so until
 *                             2026-08-16 EVERY authorization code ever
 *                             minted was still on disk — one row per
 *                             successful connection plus one per abandoned
 *                             consent, each carrying a codeHash, PKCE
 *                             challenge, redirect, scope and userId. TTL is
 *                             minutes, so anything expired is dead.
 * - `oauthAccessTokens`     — expired more than 30 days ago. Deliberately
 *                             NOT revoked-but-unexpired: a revoked row is
 *                             kept on purpose so "when did I cut this off?"
 *                             stays answerable. The grace window is so a
 *                             user asking why their connector stopped
 *                             working can still be shown the token that
 *                             lapsed.
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
      oauthRegisterIpEvents: 0,
      aiIdempotency: 0,
      passwordResetTokens: 0,
      pageviewRateLimits: 0,
      pageviews: 0,
      oauthCodes: 0,
      oauthAccessTokens: 0,
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

    // oauthRegisterIpEvents > 1 day — same pattern again.
    {
      const cutoff = now - DAY;
      const stale = (
        await ctx.db.query("oauthRegisterIpEvents").take(PRUNE_BATCH_MAX * 2)
      ).filter((e) => e.timestamp < cutoff);
      const batch = stale.slice(0, PRUNE_BATCH_MAX);
      for (const r of batch) await ctx.db.delete(r._id);
      stats.oauthRegisterIpEvents = batch.length;
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

    // pageviewRateLimits > 1 day — the analytics beacon's per-IP
    // fixed-window counter (window is 60s). A row whose `resetAt` is a day
    // old means that IP hasn't returned since; drop it so the table stays
    // O(recently-active IPs). by_reset gives a cheap range scan.
    {
      const cutoff = now - DAY;
      const stale = await ctx.db
        .query("pageviewRateLimits")
        .withIndex("by_reset", (q) => q.lt("resetAt", cutoff))
        .take(PRUNE_BATCH_MAX);
      for (const r of stale) await ctx.db.delete(r._id);
      stats.pageviewRateLimits = stale.length;
    }

    // pageviews > 180 days — the analytics dashboard never looks back
    // further, and this is the only public-write append-only table, so
    // without a TTL it grows the Dokploy volume forever. by_at is a
    // cheap ascending range scan.
    {
      const cutoff = now - 180 * DAY;
      const stale = await ctx.db
        .query("pageviews")
        .withIndex("by_at", (q) => q.lt("at", cutoff))
        .take(PRUNE_BATCH_MAX);
      for (const r of stale) await ctx.db.delete(r._id);
      stats.pageviews = stale.length;
    }

    // oauthCodes — consumed or expired. Only `by_code` exists (the exchange
    // looks a code up by its hash), so there is no range index to scan; take
    // a slice and filter, same shape as passwordResetTokens above. A code's
    // TTL is minutes, so `expiresAt < now` alone would be enough — `consumed`
    // is included because that is the flag the exchange actually sets, and a
    // consumed code is dead the instant it is redeemed.
    {
      const stale = (
        await ctx.db.query("oauthCodes").take(PRUNE_BATCH_MAX * 2)
      ).filter((c) => c.consumed || c.expiresAt < now);
      const batch = stale.slice(0, PRUNE_BATCH_MAX);
      for (const r of batch) await ctx.db.delete(r._id);
      stats.oauthCodes = batch.length;
    }

    // oauthAccessTokens expired > 30 days. Revoked-but-unexpired rows are
    // KEPT: `revokedAt` is a soft revoke on purpose (convex/mcp/schema.ts) so
    // the connections list can still show what was cut off and when. Only the
    // lapsed ones go, and only after a month, so "my connector stopped
    // working" is still answerable from the row that lapsed.
    {
      const cutoff = now - 30 * DAY;
      const stale = (
        await ctx.db.query("oauthAccessTokens").take(PRUNE_BATCH_MAX * 2)
        // A row with no `expiresAt` never expires (client_credentials default),
        // so it is never stale — deleting one would silently cut off a running
        // job, which is the opposite of pruning lapsed rows.
      ).filter((t) => t.expiresAt !== undefined && t.expiresAt < cutoff);
      const batch = stale.slice(0, PRUNE_BATCH_MAX);
      for (const r of batch) await ctx.db.delete(r._id);
      stats.oauthAccessTokens = batch.length;
    }

    return stats;
  },
});

/**
 * Repairs rows that reference a storage object which no longer exists.
 *
 * Storage IDs are stored as plain `v.string()` in four places, so nothing in
 * the schema stops a row from outliving its blob. The 2026-07-10 self-hosted →
 * Cloud migration is how it happened at scale here: the document tables came
 * across intact but only 2 of 8 blobs did, leaving 6 dead references that
 * render as broken avatars and portfolio covers. Nothing surfaces this to the
 * user or to an admin — the row looks fine, the image just never loads.
 *
 * Repair is "forget the blob", not "delete the row": a `files` entry whose
 * bytes are gone has nothing left to be, but a profile or CV or portfolio item
 * is still wanted — it just falls back to initials / gradient once the dead
 * pointer is cleared.
 *
 * DRY RUN BY DEFAULT. `apply: false` returns exactly what `apply: true` would
 * change, touching nothing:
 *
 *   npx convex run --prod admin/cleanup:pruneOrphanStorage '{}'
 *   npx convex run --prod admin/cleanup:pruneOrphanStorage '{"apply":true}'
 *
 * Not on a cron. Orphans come from migrations and bugs, not from normal use,
 * so a scheduled sweep would mostly be a scheduled way to hide the next bug.
 *
 * ponytail: full scan of four tables, capped at PRUNE_BATCH_MAX each. Fine
 * while they are in the tens; if `cvs` or `portfolioItems` ever reach five
 * figures this needs a resume cursor rather than a bigger cap.
 */
export const pruneOrphanStorage = internalMutation({
  args: { apply: v.optional(v.boolean()) },
  handler: async (ctx, { apply = false }) => {
    // The same blob is referenced from several tables, so memoise — and it
    // keeps the returned orphan list honest without a second pass.
    const checked = new Map<string, boolean>();
    const isMissing = async (id: string | undefined): Promise<boolean> => {
      if (!id) return false;
      const cached = checked.get(id);
      if (cached !== undefined) return cached;
      // normalizeId first: a malformed string is a dangling pointer too, and
      // `system.get` would throw on it rather than return null.
      const normalized = ctx.db.system.normalizeId("_storage", id);
      const missing = normalized === null || (await ctx.db.system.get(normalized)) === null;
      checked.set(id, missing);
      return missing;
    };

    const stats = { files: 0, userProfiles: 0, cvs: 0, portfolioItems: 0 };

    for (const row of await ctx.db.query("files").take(PRUNE_BATCH_MAX)) {
      if (!(await isMissing(row.storageId))) continue;
      stats.files++;
      if (apply) await ctx.db.delete(row._id);
    }

    for (const row of await ctx.db.query("userProfiles").take(PRUNE_BATCH_MAX)) {
      if (!(await isMissing(row.avatarStorageId))) continue;
      stats.userProfiles++;
      if (apply) await ctx.db.patch(row._id, { avatarStorageId: undefined });
    }

    for (const row of await ctx.db.query("cvs").take(PRUNE_BATCH_MAX)) {
      if (!(await isMissing(row.personalInfo.avatarStorageId))) continue;
      stats.cvs++;
      // personalInfo is a required object, so the whole thing is rewritten;
      // `undefined` on an optional field is how Convex drops it.
      if (apply) {
        await ctx.db.patch(row._id, {
          personalInfo: { ...row.personalInfo, avatarStorageId: undefined },
        });
      }
    }

    for (const row of await ctx.db.query("portfolioItems").take(PRUNE_BATCH_MAX)) {
      const coverDead = await isMissing(row.coverStorageId);
      const media = row.media ?? [];
      const live = [];
      for (const m of media) if (!(await isMissing(m.storageId))) live.push(m);
      if (!coverDead && live.length === media.length) continue;
      stats.portfolioItems++;
      if (apply) {
        await ctx.db.patch(row._id, {
          coverStorageId: coverDead ? undefined : row.coverStorageId,
          // Leave an absent `media` absent — an empty array is a different
          // thing to the reader than "this row predates the gallery".
          media: row.media === undefined ? undefined : live,
        });
      }
    }

    const orphanStorageIds = [...checked].filter(([, missing]) => missing).map(([id]) => id);
    return { apply, orphanStorageIds, ...stats };
  },
});
