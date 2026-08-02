import { NextResponse } from "next/server";

/**
 * `GET /api/geo` — the caller's ISO country, resolved from their IP against an
 * OFFLINE database. Drives the auto-translate decision in
 * `shared/lib/googleTranslate.ts`.
 *
 * This replaced a Convex httpAction that asked api.country.is. That worked, but
 * it sent every visitor's IP address to a third party we do not control and do
 * not name in the privacy policy — for a page-render decision. `geoip-lite` is
 * already a dependency of this app (the analytics route uses it), ships its own
 * .dat files, and answers the same question without the address leaving this
 * box. It cannot live in Convex: httpActions run in a V8 isolate with no
 * filesystem, so the data files never load. A Next route handler runs in Node,
 * so it can.
 *
 * Never non-200. "Don't know" is `{ country: null }`, because the client's
 * fallback for an unknown country is the translate OFFER banner — a working
 * product. A 5xx here would push it into a catch path for the same answer and
 * tempt someone to add a retry.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cloudflare emits `XX` when it cannot resolve one and `T1` for a Tor exit;
 *  geoip-lite can return an empty string. Any of those read as "not Indonesia"
 *  downstream and would auto-translate the page on a non-answer. */
function normalizeCountry(raw: string | null | undefined): string | null {
  const cc = (raw ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc) || cc === "XX" || cc === "T1") return null;
  return cc;
}

/**
 * Trusted-proxy precedence, matching convex/_shared/clientIp.ts. `x-real-ip`
 * and `cf-connecting-ip` are OVERWRITTEN by the edge on every request, so a
 * client cannot forge them. `x-forwarded-for` is comma-APPENDED, and the hop
 * our own proxy added is the RIGHT-most one — reading [0] takes whatever the
 * client stuffed in front of it.
 */
function clientIp(headers: Headers): string | null {
  const single = headers.get("cf-connecting-ip") ?? headers.get("x-real-ip");
  if (single?.trim()) return single.trim();
  const chain = headers.get("x-forwarded-for");
  if (!chain) return null;
  const hops = chain.split(",").map((h) => h.trim()).filter(Boolean);
  return hops.length ? hops[hops.length - 1] : null;
}

/** Docker/loopback addresses: asking for a country gets the lookup's view of
 *  our own network, i.e. a confidently wrong answer. */
const PRIVATE_IP = /^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|::1|f[cd])/i;

// geoip-lite loads ~40MB of .dat at module-eval, so it is imported lazily and
// once — a top-level import would pay that cost on every cold serverless-style
// start, including for routes that never geolocate. Same pattern as
// app/api/analytics/route.ts.
type Geo = { country?: string } | null;
let geoip: { lookup: (ip: string) => Geo } | null | undefined;

async function lookup(ip: string): Promise<string | null> {
  if (PRIVATE_IP.test(ip)) return null;
  if (geoip === undefined) {
    try {
      const m = (await import("geoip-lite")) as unknown as {
        default?: { lookup: (ip: string) => Geo };
        lookup?: (ip: string) => Geo;
      };
      geoip = (m.default ?? m) as { lookup: (ip: string) => Geo };
    } catch {
      geoip = null;
    }
  }
  try {
    return normalizeCountry(geoip?.lookup(ip)?.country);
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  // The edge may have already resolved it — free and more accurate than a
  // database snapshot, so it wins when present.
  const edge = normalizeCountry(request.headers.get("cf-ipcountry"));
  const ip = clientIp(request.headers);
  const country = edge ?? (ip ? await lookup(ip) : null);

  return NextResponse.json(
    { country, source: edge ? "cf-ipcountry" : country ? "geoip-lite" : "none" },
    {
      // Per-IP answer on a URL with no per-IP key: any shared cache would hand
      // one visitor's country to the next.
      headers: { "Cache-Control": "no-store" },
    },
  );
}
