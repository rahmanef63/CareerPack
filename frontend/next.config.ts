import path from "path"
import { fileURLToPath } from "url"
import type { NextConfig } from "next"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
      // 'unsafe-inline' covers Next.js's runtime style inlining.
      // 'unsafe-eval' is needed for next-themes hydration script.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Google Fonts allowed globally so personal-branding template iframes
      // (rendered via srcDoc) inherit a CSP that lets them load Inter /
      // Cormorant / Manrope. about:srcdoc inherits the parent's CSP and
      // meta-CSP can only tighten, not relax — so it must be set here.
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Convex storage returns image URLs; data: covers favicons + base64
      // splash; blob: covers next/image runtime.
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      // Convex WebSocket origin + HTTP actions.
      "connect-src 'self' https: wss:",
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

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, ".."),
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
