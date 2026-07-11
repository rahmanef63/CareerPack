import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../_shared/auth";

// Admin visitor dashboard read. One query powers the Traffic panel: totals +
// unique sessions + top paths/referrers/countries/cities + per-day volume.
// Role-gated by `requireAdmin` (server-side authz — never trust the route).

const DAY = 86_400_000;
const HARD_CAP = 10_000; // bounded, most-recent-first read (same rationale as the admin aggregator)

const dayKey = (t: number): string => new Date(t).toISOString().slice(0, 10);
const topN = (m: Map<string, number>, n: number) =>
  [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));

const rankValidator = v.array(v.object({ key: v.string(), count: v.number() }));

export const summary = query({
  args: { sinceMs: v.optional(v.number()) },
  returns: v.object({
    total: v.number(),
    capped: v.boolean(),
    uniqueSessions: v.number(),
    topPaths: rankValidator,
    topReferrers: rankValidator,
    topCountries: rankValidator,
    topCities: rankValidator,
    perDay: v.array(v.object({ day: v.string(), count: v.number() })),
  }),
  handler: async (ctx, { sinceMs }) => {
    await requireAdmin(ctx);
    const cutoff = Date.now() - (sinceMs ?? 30 * DAY);
    const rows = await ctx.db
      .query("pageviews")
      .withIndex("by_at", (q) => q.gt("at", cutoff))
      .order("desc")
      .take(HARD_CAP);

    const byPath = new Map<string, number>();
    const byReferrer = new Map<string, number>();
    const byCountry = new Map<string, number>();
    const byCity = new Map<string, number>();
    const byDay = new Map<string, number>();
    const sessions = new Set<string>();
    for (const r of rows) {
      byPath.set(r.path, (byPath.get(r.path) ?? 0) + 1);
      if (r.referrerHost)
        byReferrer.set(r.referrerHost, (byReferrer.get(r.referrerHost) ?? 0) + 1);
      if (r.country)
        byCountry.set(r.country, (byCountry.get(r.country) ?? 0) + 1);
      if (r.city) {
        const k = r.country ? `${r.city}, ${r.country}` : r.city;
        byCity.set(k, (byCity.get(k) ?? 0) + 1);
      }
      byDay.set(dayKey(r.at), (byDay.get(dayKey(r.at)) ?? 0) + 1);
      if (r.sessionId) sessions.add(r.sessionId);
    }

    return {
      total: rows.length,
      capped: rows.length === HARD_CAP,
      uniqueSessions: sessions.size,
      topPaths: topN(byPath, 20),
      topReferrers: topN(byReferrer, 10),
      topCountries: topN(byCountry, 10),
      topCities: topN(byCity, 10),
      perDay: [...byDay.entries()].sort().map(([day, count]) => ({ day, count })),
    };
  },
});
