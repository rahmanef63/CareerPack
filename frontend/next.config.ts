import path from "path"
import { fileURLToPath } from "url"
import { readFileSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import type { NextConfig } from "next"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Resolve the Convex origins (HTTP + WebSocket) from the build-time
 * NEXT_PUBLIC_CONVEX_URL so we can enumerate them in CSP rather than
 * relying on the broad `https:` / `wss:` source values, which let any
 * remote origin act as a connect target if XSS ever lands.
 *
 * Falls back to empty strings if the env is missing or malformed —
 * `env.ts` already enforces it at runtime; this is best-effort at
 * build-config eval.
 */
function convexOrigins(url: string | undefined): {
  http: string
  ws: string
  hostname: string
  isHttps: boolean
} {
  if (!url) return { http: "", ws: "", hostname: "", isHttps: false }
  try {
    const u = new URL(url)
    const wsScheme = u.protocol === "https:" ? "wss:" : "ws:"
    return {
      http: `${u.protocol}//${u.host}`,
      ws: `${wsScheme}//${u.host}`,
      hostname: u.hostname,
      isHttps: u.protocol === "https:",
    }
  } catch {
    return { http: "", ws: "", hostname: "", isHttps: false }
  }
}

const CONVEX = convexOrigins(process.env.NEXT_PUBLIC_CONVEX_URL)
// Wildcard fallbacks so the same build CSP works for cloud Convex
// (storage on *.convex.cloud, sometimes *.convex.site) without requiring
// a separate env. Self-hosted deploys also benefit because CONVEX.http
// matches the API origin and these wildcards cover the site origin if it
// shares the convex.* suffix.
const CONVEX_WILDCARDS_HTTP = "https://*.convex.cloud https://*.convex.site"
const CONVEX_WILDCARDS_WS = "wss://*.convex.cloud wss://*.convex.site"

/**
 * Security + observability headers applied to every response.
 *
 * - `Content-Security-Policy` is intentionally permissive in the
 *   `script-src` direction because tweakcn theme presets inline a
 *   CSS variable patch and Next.js inlines a small bootstrap chunk.
 *   `'unsafe-inline'` for styles is required by Tailwind's @apply +
 *   the per-render CSS-vars Next emits. We tighten elsewhere:
 *   - `frame-ancestors 'none'` blocks click-jacking
 *   - `object-src 'none'` blocks legacy Flash/PDF embeds
 *   - `connect-src` allow-list scoped to Convex prod URL
 * - The Permissions-Policy and Referrer-Policy values match Next.js
 *   defaults but explicitly enumerated so we control them not the
 *   framework.
 */
const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-inline' is unavoidable here: Next.js emits inline
      // <script> for hydration / next-themes flash-prevention, and
      // adopting nonces means wiring middleware that injects a
      // per-request nonce into both the response and every emitted
      // script tag — significant rework. 'unsafe-eval' is dropped
      // (no eval / new Function in the bundle; verified via grep).
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
      // Google Fonts allowed globally so personal-branding template iframes
      // (rendered via srcDoc) inherit a CSP that lets them load Inter /
      // Cormorant / Manrope. about:srcdoc inherits the parent's CSP and
      // meta-CSP can only tighten, not relax — so it must be set here.
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Convex storage returns image URLs; data: covers favicons + base64
      // splash; blob: covers next/image runtime. Allow Unsplash for
      // personal-branding template thumbnails + the Convex deploy origin
      // for stored avatars/portfolio media.
      `img-src 'self' data: blob: https://images.unsplash.com ${CONVEX.http} ${CONVEX_WILDCARDS_HTTP}`,
      "font-src 'self' data: https://fonts.gstatic.com",
      // Enumerate connect-src to the Convex deploy origin + WS upgrade.
      // `https:`/`wss:` were too broad — defeated CSP exfil-control if
      // XSS ever landed. GA4 (script-src allows googletagmanager.com to
      // load gtag.js) beacons to google-analytics.com, falling back to
      // google.com/g/collect when the former is blocked (ad blockers) —
      // both were missing here, so every hit was silently CSP-blocked.
      `connect-src 'self' ${CONVEX.http} ${CONVEX.ws} ${CONVEX_WILDCARDS_HTTP} ${CONVEX_WILDCARDS_WS} https://www.google-analytics.com https://www.google.com`,
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // HSTS for HTTPS deploys. Safe under Dokploy TLS termination — no
  // effect over plain http (browsers ignore the header).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
]

/**
 * Personal-branding HTML templates live in /public/personal-branding/templates/
 * and are framed inside the app's theme renderer. The default
 * `frame-ancestors 'none'` + `X-Frame-Options: DENY` would block that even
 * when same-origin. We relax to `'self'` only for this static path.
 *
 * Loaded fonts (Google Fonts), images (unsplash), and inline styles in those
 * templates also need their own CSP — so we widen `style-src`, `font-src`,
 * `img-src` for this path while keeping app-wide rules tight.
 */
const TEMPLATE_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https:",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
]

// Stable build-id for this output. Embedded into the client bundle as
// `process.env.NEXT_PUBLIC_BUILD_ID` (frozen at build time) and served
// at runtime via `/api/build-id`. The UpdateChecker on the client polls
// the runtime endpoint and compares to its frozen value; mismatch =
// the user's tab is on an older deploy → toast prompts a refresh.
// BUILD_ID must be IDENTICAL across every next.config re-evaluation. Next
// re-requires this file in separate compiler passes (build orchestrator /
// generateBuildId, server bundle, client DefinePlugin) — a bare `Date.now()`
// froze a DIFFERENT millisecond in each, so the client-baked
// NEXT_PUBLIC_BUILD_ID could NEVER equal the on-disk `.next/BUILD_ID` that
// `/api/build-id` serves. UpdateChecker read that as "new deploy" and
// force-reloaded on every focus/interval — the "refresh sendiri" bug.
//
// Prefer an injected build-time env (Dockerfile sets it once for the whole
// build → all passes agree, race-free). Otherwise memoize the first computed
// value to a shared temp file so separate passes read back the same id.
// ponytail: the write-then-read across passes has a tiny race, but the worst
// case is ONE stray reload, not a loop — the Dockerfile env removes it in prod.
function resolveBuildId(): string {
  const injected =
    process.env.NEXT_PUBLIC_BUILD_ID?.trim() || process.env.GITHUB_SHA?.slice(0, 12);
  if (injected) return injected;
  const memo = path.join(tmpdir(), "careerpack-build-id");
  try {
    const cached = readFileSync(memo, "utf8").trim();
    if (cached) return cached;
  } catch {
    /* first pass — create it below */
  }
  const fresh = `b${Date.now().toString(36)}`;
  try {
    writeFileSync(memo, fresh);
  } catch {
    /* read-only fs — fall through; Dockerfile env covers the prod path */
  }
  return fresh;
}
const BUILD_ID = resolveBuildId();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, ".."),
  // geoip-lite loads its .dat data files from disk at runtime; the
  // standalone output tracer can't see those fs reads, so include them
  // explicitly for the analytics beacon route or the Dokploy image ships
  // without them (geo silently empty — all geo fields are optional, so the
  // beacon still records path/referrer/session). Glob is relative to this
  // (frontend) project dir; the tracer follows the pnpm symlink into the
  // hoisted store under outputFileTracingRoot (repo root).
  outputFileTracingIncludes: {
    "/api/analytics": ["./node_modules/geoip-lite/data/**"],
  },
  // Keep geoip-lite OUT of the webpack bundle. Bundled, its CommonJS module
  // (which fs.readFileSync's its .dat at eval) gets inlined into the route
  // chunk with a rewritten __dirname, so `next build`'s "collect page data"
  // step evaluates it and crashes with ENOENT on
  // .next/server/app/api/data/geoip-country.dat. External → it's require()d
  // from node_modules at runtime with the correct __dirname; the lazy import
  // in the route means it never loads at build time at all.
  serverExternalPackages: ["geoip-lite"],
  transpilePackages: ["rahman-shared"],
  generateBuildId: async () => BUILD_ID,
  env: { NEXT_PUBLIC_BUILD_ID: BUILD_ID },
  // next/image remote allow-list. Drops the need for `unoptimized` on
  // known-safe sources (Convex storage, Unsplash). data: / blob: still
  // bypass via the `unoptimized` flag on a per-component basis.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.convex.cloud" },
      { protocol: "https", hostname: "*.convex.site" },
      // Self-hosted deploy host (skip localhost / IP addresses — those
      // serve dev only and `unoptimized` is fine there).
      ...(CONVEX.isHttps &&
      CONVEX.hostname &&
      !/^(localhost|127\.|10\.|192\.168\.|0\.)/.test(CONVEX.hostname)
        ? [{ protocol: "https" as const, hostname: CONVEX.hostname }]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/personal-branding/templates/:path*",
        headers: TEMPLATE_HEADERS,
      },
      {
        // Negative-lookahead excludes the templates path so the browser
        // doesn't receive two CSP headers (intersection = most restrictive,
        // which would re-add `frame-ancestors 'none'`).
        source: "/((?!personal-branding/templates/).*)",
        headers: SECURITY_HEADERS,
      },
    ]
  },
}

export default nextConfig
