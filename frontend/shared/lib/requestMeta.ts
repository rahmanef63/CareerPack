/**
 * Request-metadata helpers for Node.js route handlers (the analytics
 * beacon). Mirrors the trusted-proxy IP logic in
 * `convex/_shared/clientIp.ts` — kept as a separate frontend module so a
 * Next route never has to reach across the project boundary into the
 * Convex tsconfig.
 */

/**
 * Caller IP for geo lookup + per-IP rate-limit bucketing.
 *
 * SECURITY: never trust the LEFT-most `x-forwarded-for` hop — a client can
 * prepend a forged value and the trusted proxy only APPENDS the real peer
 * after it, so `[0]` is attacker-controlled (rotate it → a fresh bucket
 * every request → limiter defeated). Prefer edge-overwritten single-value
 * headers (`cf-connecting-ip`, `x-real-ip`), then the RIGHT-most XFF hop
 * (the one our own proxy added). Returns "" when no header is present so
 * the caller skips geo + hashing entirely.
 *
 * ponytail: assumes ONE trusted proxy (Traefik/Dokploy) or Cloudflare in
 * front. If the trusted-hop count ever changes, revisit the right-most pick.
 */
export function clientIp(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf?.trim()) return cf.trim();
  const real = req.headers.get("x-real-ip");
  if (real?.trim()) return real.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return "";
}

/**
 * Public origin of this deployment, used to drop own-host self-referrals
 * (SPA nav is same-origin). Behind Dokploy/Traefik the standalone server
 * sees `http://0.0.0.0:3000`, so prefer the configured `APP_URL`, then the
 * proxy's forwarded host, then the request origin. No hardcoded domain.
 */
export function publicOrigin(req: Request): string {
  const app = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (app) return app.replace(/\/+$/, "");
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  try {
    return new URL(req.url).origin;
  } catch {
    return "";
  }
}
