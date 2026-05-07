import { internalMutation, httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { extractClientIp, sha256Hex } from "./_shared/clientIp";

/**
 * `/api/auth/check-email` — IP rate-limited "does this email already
 * have an account?" lookup, used by the login form to pick signIn vs
 * signUp flow.
 *
 * Public-readable enumeration via `userExistsByEmail` was removed
 * (2026-05-07): a query gives no hook to gate by IP, so an attacker
 * could probe an unlimited number of emails over WebSocket. This
 * httpAction enforces a 30/hr per-IP cap (login is more frequent than
 * password reset, so cap is laxer than the 10/hr reset bucket).
 *
 * Pattern mirrors `/api/password-reset/request` end-to-end — IP hash
 * in the action, rate-limit + lookup in the internal mutation.
 */

const LOGIN_CHECK_RATE_WINDOW_MS = 60 * 60 * 1000;
const LOGIN_CHECK_RATE_MAX = 30;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

/**
 * Two-step rate-limit + lookup.
 *
 * On overflow returns `{ rateLimited: true }`. The httpAction then
 * surfaces 429 so the frontend can show a generic "too many attempts"
 * message — strictly worse anti-enumeration than always returning a
 * fixed answer, but the UX cost of guessing wrong (signIn-vs-signUp
 * misroute) is high enough to keep the explicit 429.
 *
 * User lookup is inlined (mutation can read `users` directly) rather
 * than dispatched to a separate internalQuery — keeping it inline
 * avoids a self-referential `internal.authCheckEmail.*` type that
 * collapses the whole api type-graph to `any`.
 */
export const _ipGatedCheckEmail = internalMutation({
  args: { email: v.string(), ipHash: v.string() },
  returns: v.union(
    v.object({ rateLimited: v.literal(true) }),
    v.object({ rateLimited: v.literal(false), exists: v.boolean() }),
  ),
  handler: async (ctx, { email, ipHash }) => {
    const now = Date.now();
    const windowStart = now - LOGIN_CHECK_RATE_WINDOW_MS;
    const events = await ctx.db
      .query("loginCheckIpEvents")
      .withIndex("by_ipHash_time", (q) =>
        q.eq("ipHash", ipHash).gte("timestamp", windowStart),
      )
      .collect();
    if (events.length >= LOGIN_CHECK_RATE_MAX) {
      console.warn(
        `[check-email] per-IP rate-limited ipHash=${ipHash.slice(0, 8)}… (${events.length}/${LOGIN_CHECK_RATE_MAX} in last hour)`,
      );
      return { rateLimited: true as const };
    }
    await ctx.db.insert("loginCheckIpEvents", { ipHash, timestamp: now });

    const normalized = email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), normalized))
      .first();
    return { rateLimited: false as const, exists: !!user };
  },
});

export const handleCheckEmail = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== "POST") {
    return new Response("method_not_allowed", {
      status: 405,
      headers: CORS_HEADERS,
    });
  }

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return new Response("invalid_json", { status: 400, headers: CORS_HEADERS });
  }
  if (!parsed || typeof parsed !== "object") {
    return new Response("missing_payload", { status: 400, headers: CORS_HEADERS });
  }
  const email = (parsed as Record<string, unknown>).email;
  if (typeof email !== "string" || email.length === 0 || email.length > 200) {
    return new Response("missing_email", { status: 400, headers: CORS_HEADERS });
  }

  const ip = extractClientIp(request.headers);
  const ipHash = await sha256Hex(ip);

  const result = await ctx.runMutation(
    internal.authCheckEmail._ipGatedCheckEmail,
    { email, ipHash },
  );

  if (result.rateLimited) {
    return new Response(JSON.stringify({ error: "rate_limited" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  return new Response(JSON.stringify({ exists: result.exists }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
});
