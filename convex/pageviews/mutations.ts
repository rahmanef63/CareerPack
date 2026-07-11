import { mutation } from "../_generated/server";
import { v } from "convex/values";

// PUBLIC cookieless visitor beacon ingest. Called ONLY by the
// /api/analytics route (which resolves geo + hashes the caller IP into a
// bucket key); the raw IP never reaches Convex. Never stores a raw IP or a
// stable identifier. Sibling of `queries.summary` (the admin dashboard read).

const RL_WINDOW = 60_000;
const RL_MAX = 240; // beacons per IP per minute — generous; throttles a runaway tab/bot only
const PROP_CAP = 2000;
const VIEWPORTS = new Set(["mobile", "tablet", "desktop"]);

const trimUtm = (s?: string): string | undefined => {
  if (!s) return undefined;
  const t = s.trim().toLowerCase().slice(0, 120);
  return t || undefined;
};

// Public-write surface: abuse is bounded by the per-IP fixed-window limiter
// below. The route passes `ipHash` (sha256 of the caller IP) purely as a
// bucket key. Geo fields are resolved server-side in the route.
export const record = mutation({
  args: {
    path: v.string(),
    referrerHost: v.optional(v.string()),
    viewport: v.optional(v.string()),
    eventType: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    country: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    lat: v.optional(v.number()),
    lon: v.optional(v.number()),
    properties: v.optional(v.string()),
    ipHash: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, a) => {
    const path = a.path.slice(0, 256);
    // Never track the signed-in console, admin panel, or API routes.
    if (
      !path ||
      path.startsWith("/dashboard") ||
      path.startsWith("/admin") ||
      path.startsWith("/api")
    ) {
      return null;
    }

    // Per-IP fixed-window limiter. OCC-safe read-modify-write on the
    // pageviewRateLimits counter — no library needed.
    if (a.ipHash) {
      const key = `pv:${a.ipHash}`;
      const now = Date.now();
      const row = await ctx.db
        .query("pageviewRateLimits")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      if (!row || now >= row.resetAt) {
        if (row) {
          await ctx.db.patch(row._id, { count: 1, resetAt: now + RL_WINDOW });
        } else {
          await ctx.db.insert("pageviewRateLimits", {
            key,
            count: 1,
            resetAt: now + RL_WINDOW,
          });
        }
      } else if (row.count >= RL_MAX) {
        return null; // over cap — drop silently
      } else {
        await ctx.db.patch(row._id, { count: row.count + 1 });
      }
    }

    const country =
      a.country && /^[A-Z]{2}$/.test(a.country) ? a.country : undefined;
    const sessionId =
      a.sessionId && /^[a-f0-9]{8,64}$/.test(a.sessionId)
        ? a.sessionId
        : undefined;
    const properties =
      a.properties && a.properties.length <= PROP_CAP ? a.properties : undefined;

    await ctx.db.insert("pageviews", {
      path,
      referrerHost: a.referrerHost?.slice(0, 80),
      viewport: a.viewport && VIEWPORTS.has(a.viewport) ? a.viewport : undefined,
      eventType: a.eventType?.slice(0, 40) || "page_view",
      sessionId,
      utmSource: trimUtm(a.utmSource),
      utmMedium: trimUtm(a.utmMedium),
      utmCampaign: trimUtm(a.utmCampaign),
      utmTerm: trimUtm(a.utmTerm),
      utmContent: trimUtm(a.utmContent),
      country,
      region: a.region?.slice(0, 8),
      city: a.city?.slice(0, 80),
      lat: a.lat,
      lon: a.lon,
      properties,
      at: Date.now(),
    });
    return null;
  },
});
