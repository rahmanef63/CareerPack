import { NextResponse } from "next/server";

/**
 * `GET /api/health` on the APP origin (careerpack.org).
 *
 * The Convex backend has had its own `/api/health` for a while, but it lives
 * on the Convex domain — so an uptime monitor pointed at the site itself got a
 * 404 and had to be configured against a page instead. Which means it went
 * green on a cached HTML response while the Node server behind it was gone.
 * This is the endpoint a monitor should actually watch.
 *
 * Scope is deliberately narrow: this answers "is the Next.js server running
 * and executing code", nothing more. It does NOT reach out to Convex —
 * a monitor that fans out to a dependency turns one outage into two alerts,
 * and Convex already exposes its own probe (with db + feature readiness) for
 * whoever wants to watch it directly.
 *
 * `force-dynamic` because a statically prerendered health check is a lie: it
 * would keep returning 200 from cache after the process died.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  return NextResponse.json(
    { ok: true, ts: Date.now(), service: "frontend" },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "CDN-Cache-Control": "no-store",
      },
    },
  );
}
