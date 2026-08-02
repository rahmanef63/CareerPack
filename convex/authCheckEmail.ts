import { internalMutation, httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { extractClientIp, sha256Hex } from "./_shared/clientIp";
import { rejectIfBadOrigin } from "./_shared/origin";

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
 * On overflow returns `{ rateLimited: true }` and the httpAction answers
 * `{ exists: null }` — "won't say" — see `handleCheckEmail`.
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
      .withIndex("email", (q) => q.eq("email", normalized))
      .first();
    return { rateLimited: false as const, exists: !!user };
  },
});

/**
 * Mutation behind `/api/auth/signin-attempt` — bumps the same
 * `loginCheckIpEvents` bucket that gates email-check, so brute-force
 * signIn attempts share a budget with the pre-check. Cap is still
 * 30/hr/IP; each failed signIn burns one slot. Legit users (3 retries
 * tops) stay well under, attackers cap out fast.
 *
 * Note: Convex auth `signIn()` is sealed — we can't intercept its
 * verify path. This is a frontend-cooperation gate: the official
 * client must call this httpAction after every failed signIn.
 * Raw-WebSocket abuse bypasses, but mid-tier scripts running through
 * the official flow are throttled.
 */
export const _bumpLoginFailure = internalMutation({
  args: { ipHash: v.string() },
  returns: v.null(),
  handler: async (ctx, { ipHash }) => {
    await ctx.db.insert("loginCheckIpEvents", { ipHash, timestamp: Date.now() });
    return null;
  },
});

export const handleSignInAttempt = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== "POST") {
    return new Response("method_not_allowed", {
      status: 405,
      headers: CORS_HEADERS,
    });
  }
  const originRejection = rejectIfBadOrigin(request, CORS_HEADERS);
  if (originRejection) return originRejection;

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return new Response("invalid_json", { status: 400, headers: CORS_HEADERS });
  }
  const success = (parsed as Record<string, unknown> | null)?.success;
  if (typeof success !== "boolean") {
    return new Response("missing_success", { status: 400, headers: CORS_HEADERS });
  }

  // Only bump the bucket on failure — successful logins shouldn't
  // burn the legit user's quota.
  if (!success) {
    const ip = extractClientIp(request.headers);
    const ipHash = await sha256Hex(ip);
    await ctx.runMutation(internal.authCheckEmail._bumpLoginFailure, { ipHash });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
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

  const originRejection = rejectIfBadOrigin(request, CORS_HEADERS);
  if (originRejection) return originRejection;

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

  // Over the cap we stop ANSWERING the exists/not-exists question — the
  // one thing this bucket protects — instead of refusing the request.
  // The old 429 broke signup outright for everyone sharing an exit IP,
  // and Indonesian mobile carriers put whole cities behind CGNAT: 30
  // signups/hour from one carrier egress is a normal launch day, not an
  // attack. `exists: null` = "won't say"; useAuth.login then attempts
  // signUp and falls back to signIn. Disclosure is unchanged (429 and
  // null both reveal nothing), and the fallback only uses the public
  // `auth:signIn` action, which this bucket never gated anyway.
  return new Response(
    JSON.stringify({ exists: result.rateLimited ? null : result.exists }),
    { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
  );
});
