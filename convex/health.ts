import { httpAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * `GET /api/health` — liveness + DB-ping probe.
 *
 * Designed for Dokploy's container healthcheck and external uptime
 * monitors (UptimeRobot etc.). Costs one tiny DB read; safe to poll
 * every 30s.
 *
 * 200 + `{ ok: true, ts, db: true }` — Convex + db reachable.
 * 503 + `{ ok: false, error }`     — query failed; container should
 *                                     be considered unhealthy.
 *
 * No auth + no rate-limit by design — must be reachable from probes
 * with no credentials. Returns no PII / version info beyond a build
 * timestamp.
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
