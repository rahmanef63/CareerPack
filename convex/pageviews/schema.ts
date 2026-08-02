import { defineTable } from "convex/server";
import { v } from "convex/values";

// Cookieless visitor analytics — one row per page_view / custom event.
// No cookie, no stored IP (geo is resolved server-side in the
// /api/analytics route then the raw IP is discarded), no stable
// identifier. `sessionId` is an ephemeral sessionStorage random — enough
// to count unique visits without tracking a person. Additive schema:
// older rows read fine with newer optional fields undefined.
export const pageviewTables = {
  pageviews: defineTable({
    path: v.string(), // pathname only, no querystring
    referrerHost: v.optional(v.string()), // origin host only, never the full URL
    viewport: v.optional(v.string()), // "mobile" | "tablet" | "desktop"
    eventType: v.optional(v.string()), // "page_view" (default) | custom event name
    sessionId: v.optional(v.string()), // ephemeral per-session random (16 hex)
    // campaign attribution (captured on first hit, re-sent per event)
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    // geo — resolved from the client IP via geoip-lite in the route, then
    // the raw IP is dropped (never stored). All optional (a lookup can miss).
    country: v.optional(v.string()), // ISO-3166-1 alpha-2
    region: v.optional(v.string()), // subdivision code
    city: v.optional(v.string()),
    lat: v.optional(v.number()),
    lon: v.optional(v.number()),
    properties: v.optional(v.string()), // JSON string, capped, for custom events
    at: v.number(),
  })
    .index("by_at", ["at"])
    .index("by_path_at", ["path", "at"]),

  // Anti-abuse fixed-window counter for the public `record` beacon ingest.
  // One row per "pv:<ipHash>"; Convex OCC makes the read-modify-write
  // race-safe, so no rate-limiter library or lock is needed. This is the
  // "simple counter" variant (the app's other per-IP gates use append-only
  // ipHash-event tables, but a beacon fires far more often than a login, so
  // a patched-in-place counter keeps row growth at O(distinct IPs) instead
  // of O(hits)). Stale rows (an IP that never returns) are swept by
  // `internal.admin.cleanup.pruneAppendOnlyTables` via `by_reset`.
  pageviewRateLimits: defineTable({
    key: v.string(), // "pv:<sha256(ip)>"
    count: v.number(),
    resetAt: v.number(), // window end (ms epoch); past it the window resets
  })
    .index("by_key", ["key"])
    .index("by_reset", ["resetAt"]),
};
