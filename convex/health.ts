import { httpAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { emailConfigured } from "./_shared/email";
import { optionalEnv } from "./_shared/env";

/**
 * `GET /api/health` — liveness + DB ping + feature readiness.
 *
 * Designed for Dokploy's container healthcheck and external uptime
 * monitors (UptimeRobot etc.). Costs one tiny DB read; safe to poll
 * every 30s.
 *
 * 200 + `{ ok: true, ts, db: true, ready: {...} }` — Convex + db reachable.
 * 503 + `{ ok: false, error }`     — query failed; container should
 *                                     be considered unhealthy.
 *
 * The `ready` block reports whether the two runtime-CONFIGURED subsystems are
 * wired in this deployment. Both live in DB rows / Convex env rather than in
 * code, so a green build says nothing about them — and both fail in ways a
 * click-through misses: unconfigured AI throws only once a user runs a
 * generation, and unconfigured email fails on the recipient's end where nobody
 * is looking. This makes "is prod actually configured" a one-curl question.
 *
 * `ready` deliberately does NOT affect the status code. A deploy with AI off
 * is degraded, not down, and flipping the container healthcheck red for it
 * would have Dokploy restart-loop a perfectly serving backend.
 *
 * No auth + no rate-limit by design — must be reachable from probes with no
 * credentials. So `ready` carries BOOLEANS ONLY: no provider names, no key
 * previews, no sender address. "AI is on" is not a secret; which vendor and
 * which key would be.
 */
export const _dbPing = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Tiny read — `users` always has at least the seed system row in
    // a working deploy. Even on empty DB this returns null fast.
    await ctx.db.query("users").first();
    return { ok: true as const };
  },
});

/**
 * Can ANY user run an AI feature? True when the admin-managed global row is
 * enabled with a key, or the env fallback pair is set.
 *
 * Mirrors `_shared/aiResolve.ts` minus the per-user branch, which is a
 * per-request lookup and not a deployment property. A user with their own key
 * works even when this reports false — but a brand-new visitor does not, and
 * that visitor is the one who decides whether the product works.
 */
export const _aiReady = internalQuery({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query("globalAISettings").first();
    if (row?.enabled && row.apiKey) return true;
    return Boolean(
      optionalEnv("CONVEX_OPENAI_BASE_URL") && optionalEnv("CONVEX_OPENAI_API_KEY"),
    );
  },
});

export const handleHealth = httpAction(async (ctx, request) => {
  if (request.method !== "GET") {
    return new Response("method_not_allowed", { status: 405 });
  }
  try {
    await ctx.runQuery(internal.health._dbPing, {});
    const body = JSON.stringify({
      ok: true,
      ts: Date.now(),
      db: true,
      ready: {
        ai: await ctx.runQuery(internal.health._aiReady, {}),
        email: emailConfigured(),
      },
    });
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
});
