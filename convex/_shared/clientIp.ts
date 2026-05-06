/**
 * Pure helpers for client-IP extraction in httpAction handlers.
 *
 * Convex mutations don't expose request IP — only httpActions do via
 * `request.headers`. The header dance (proxy precedence, multiple
 * x-forwarded-for entries, fallback to x-real-ip) is fiddly enough to
 * deserve its own testable module.
 *
 * Resolution order — first match wins:
 *   1. `x-forwarded-for` first hop (client IP behind trusted proxy/CDN)
 *   2. `x-real-ip` (some CDNs use this exclusively)
 *   3. `cf-connecting-ip` (Cloudflare)
 *   4. literal "unknown" so callers always get a string
 */
export function extractClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) {
    const trimmed = real.trim();
    if (trimmed) return trimmed;
  }
  const cf = headers.get("cf-connecting-ip");
  if (cf) {
    const trimmed = cf.trim();
    if (trimmed) return trimmed;
  }
  return "unknown";
}

/**
 * SHA-256 of an arbitrary string, hex-encoded. Used to bucket per-IP
 * rate limits without ever persisting the raw IP.
 */
export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc as BufferSource);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
