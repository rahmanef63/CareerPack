// Cookieless visitor beacon ingest. The client posts via
// navigator.sendBeacon; we resolve geo from the caller IP (geoip-lite —
// offline, no MaxMind, no external call), hash the IP into a rate-limit
// bucket key, then DISCARD the raw IP (never sent to Convex, never stored).
// Fire-and-forget → always 204.
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { clientIp, publicOrigin } from "@/shared/lib/requestMeta";
import { createHash } from "node:crypto";

// geoip-lite loads its .dat data at module-eval and ships without it → a TOP-LEVEL import
// crashes `next build`. Lazy + guarded: builds clean; geo degrades to null if data is absent.
type _Geo = { country?: string; region?: string; city?: string; ll?: [number, number] } | null;
let _geoip: { lookup: (ip: string) => _Geo } | null | undefined;
async function lookupGeo(ip: string): Promise<_Geo> {
  if (_geoip === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m: any = await import("geoip-lite");
      _geoip = m.default ?? m;
    } catch { _geoip = null; }
  }
  try { return _geoip?.lookup(ip) ?? null; } catch { return null; }
}

export const dynamic = "force-dynamic"; // never statically cache a beacon POST

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || "";
const VIEWPORTS = new Set(["mobile", "tablet", "desktop"]);
const str = (x: unknown, max: number): string | undefined =>
  typeof x === "string" && x ? x.slice(0, max) : undefined;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return new Response(null, { status: 204 });
  }

  const path = str(body?.path, 256);
  // Never track the signed-in dashboard, admin panel, or API routes.
  if (
    !path ||
    path.startsWith("/dashboard") ||
    path.startsWith("/admin") ||
    path.startsWith("/api")
  ) {
    return new Response(null, { status: 204 });
  }

  // referrer → host, dropping own-host self-referrals (SPA nav is same-origin).
  let referrerHost: string | undefined;
  const ref = str(body?.referrer, 300);
  if (ref) {
    try {
      const u = new URL(ref);
      const ownHost = new URL(publicOrigin(req)).host;
      if (u.host && u.host !== ownHost) referrerHost = u.host.slice(0, 80);
    } catch {
      /* malformed referrer — ignore */
    }
  }

  const ip = clientIp(req);
  const geo = ip ? (await lookupGeo(ip)) : null;
  const ipHash = ip ? createHash("sha256").update(ip).digest("hex") : undefined;

  if (!CONVEX_URL) return new Response(null, { status: 204 });
  const client = new ConvexHttpClient(CONVEX_URL);
  void client
    .mutation(api.pageviews.mutations.record, {
      path,
      referrerHost,
      viewport: VIEWPORTS.has(body?.viewport as string)
        ? (body.viewport as string)
        : undefined,
      eventType: str(body?.eventType, 40),
      sessionId: str(body?.sessionId, 64),
      utmSource: str(body?.utmSource, 120),
      utmMedium: str(body?.utmMedium, 120),
      utmCampaign: str(body?.utmCampaign, 120),
      utmTerm: str(body?.utmTerm, 120),
      utmContent: str(body?.utmContent, 120),
      country: geo?.country || undefined,
      region: geo?.region || undefined,
      city: geo?.city || undefined,
      lat: geo?.ll?.[0],
      lon: geo?.ll?.[1],
      properties: str(body?.properties, 2000),
      ipHash,
    })
    .catch(() => {});

  return new Response(null, { status: 204 });
}
