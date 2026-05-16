import { internalMutation } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

/**
 * Hourly admin-dashboard aggregator.
 *
 * Replaces the 5 unbounded `.collect()` calls that used to fire on every
 * Admin Dashboard tick (`users`, `cvs`, `jobApplications`,
 * `rateLimitEvents`, `errorLogs`). Cron runs once per hour and upserts a
 * single `adminStats` doc keyed by `"global"`; the admin queries then
 * read O(1) from that doc.
 *
 * Staleness budget: ≤ 1 hour. Acceptable for an internal-ops dashboard;
 * fast iterators (active load, current spike) can still be derived from
 * the most-recent daily bucket which the aggregator refreshes hourly.
 */

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const TOP_N = 10;

export const recomputeAdminStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoff = now - THIRTY_DAYS_MS;

    const [users, cvs, applications, rateEvents, errorLogs] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("cvs").collect(),
      ctx.db.query("jobApplications").collect(),
      ctx.db.query("rateLimitEvents").collect(),
      ctx.db.query("errorLogs").collect(),
    ]);

    const recentEvents = rateEvents.filter((e) => e.timestamp >= cutoff);
    const activeUserIds = new Set(recentEvents.map((e) => e.userId));
    const aiEvents = rateEvents.filter((e) => e.key.startsWith("ai:"));
    const aiEventsLastMonth = aiEvents.filter((e) => e.timestamp >= cutoff);

    const aiDayEvents = rateEvents.filter(
      (e) => e.key === "ai:day" && e.timestamp >= cutoff,
    );
    const recentErrors = errorLogs.filter((e) => e.timestamp >= cutoff);

    const startOfToday = Math.floor(now / DAY_MS) * DAY_MS;
    const aiDaily30d = Array.from({ length: 30 }, (_, i) => {
      const dayStart = startOfToday - (29 - i) * DAY_MS;
      const dayEnd = dayStart + DAY_MS;
      const requests = aiDayEvents.filter(
        (e) => e.timestamp >= dayStart && e.timestamp < dayEnd,
      ).length;
      const errors = recentErrors.filter(
        (e) => e.timestamp >= dayStart && e.timestamp < dayEnd,
      ).length;
      return {
        date: new Date(dayStart).toISOString().slice(0, 10),
        requests,
        errors,
      };
    });

    const userCounts = new Map<string, number>();
    for (const e of aiDayEvents) {
      userCounts.set(e.userId, (userCounts.get(e.userId) ?? 0) + 1);
    }
    const userById = new Map(users.map((u) => [u._id, u]));
    const topAIUsers = Array.from(userCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N)
      .map(([userId, count]) => {
        const u = userById.get(userId as Doc<"users">["_id"]);
        return {
          userId: userId as Doc<"users">["_id"],
          email: u?.email ?? null,
          name: u?.name ?? null,
          count,
        };
      });

    const sourceCounts = new Map<string, number>();
    for (const e of recentErrors) {
      const k = e.source?.trim();
      if (!k) continue;
      sourceCounts.set(k, (sourceCounts.get(k) ?? 0) + 1);
    }
    const topErrorSources = Array.from(sourceCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_N);

    const aiLast60s = rateEvents.filter(
      (e) => e.key === "ai:minute" && e.timestamp >= now - 60_000,
    ).length;
    const aiLast24h = rateEvents.filter(
      (e) => e.key === "ai:day" && e.timestamp >= now - DAY_MS,
    ).length;

    const payload = {
      key: "global" as const,
      computedAt: now,
      totalUsers: users.length,
      activeUsers30d: activeUserIds.size,
      totalCVs: cvs.length,
      totalApplications: applications.length,
      aiTotalRequests: aiEvents.length,
      aiLastMonth: aiEventsLastMonth.length,
      aiDaily30d,
      topAIUsers,
      topErrorSources,
      aiTotalRequests30d: aiDayEvents.length,
      totalErrors30d: recentErrors.length,
      aiLast60s,
      aiLast24h,
    };

    const existing = await ctx.db
      .query("adminStats")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return { ok: true as const, action: "patched", computedAt: now };
    }
    await ctx.db.insert("adminStats", payload);
    return { ok: true as const, action: "inserted", computedAt: now };
  },
});
