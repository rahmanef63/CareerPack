/**
 * Pure helpers for client-IP extraction in httpAction handlers.
 *
 * Convex mutations don't expose request IP — only httpActions do via
 * `request.headers`. The header dance (proxy precedence, multiple
 * x-forwarded-for entries, fallback to x-real-ip) is fiddly enough to
 * deserve its own testable module.
 *
 * TRUSTED-PROXY ASSUMPTION: in production the Convex backend sits behind
 * Dokploy/Traefik (and optionally Cloudflare). Those reverse proxies are
 * the only hop we trust. This matters for picking the right header value:
 *
 *   - `cf-connecting-ip` / `x-real-ip` are *overwritten* (not appended) by
 *     the edge proxy on every request, so whatever a malicious client sets
 *     is clobbered before we see it — these are safe to trust verbatim and
 *     take precedence.
 *   - `x-forwarded-for` is a *comma-appended* chain: each proxy tacks the
 *     IP it received the connection from onto the RIGHT. A client can stuff
 *     arbitrary forged entries on the LEFT, but it cannot forge the value
 *     our trusted proxy appends last. So the genuine client IP is the
 *     RIGHT-most hop, NOT `[0]`. Reading `[0]` (the old behaviour) let an
 *     attacker rotate a forged leftmost value per request to land in a
 *     fresh per-IP rate-limit bucket and bypass every per-IP gate
 *     (check-email enumeration, password-reset spam).
 *
 * Resolution order — first match wins:
 *   1. `cf-connecting-ip` (Cloudflare, edge-overwritten single value)
 *   2. `x-real-ip` (some proxies set this exclusively, also overwritten)
 *   3. `x-forwarded-for` last (right-most) hop — the IP appended by the
 *      trusted proxy, validated as a plausible IP
 *   4. literal "unknown" so callers always get a string
 */
export function extractClientIp(headers: Headers): string {
  // Edge-overwritten single-value headers first — a client cannot forge
  // these past the trusted proxy.
  const cf = headers.get("cf-connecting-ip");
  if (cf) {
    const trimmed = cf.trim();
    if (trimmed) return trimmed;
  }
  const real = headers.get("x-real-ip");
  if (real) {
    const trimmed = real.trim();
    if (trimmed) return trimmed;
  }

  // x-forwarded-for is client-appendable on the left; only the right-most
  // hop (added by our trusted proxy) is non-spoofable. Walk from the right
  // and take the first entry that looks like a real IP.
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",");
    for (let i = parts.length - 1; i >= 0; i--) {
      const candidate = parts[i]?.trim();
      if (candidate && isPlausibleIp(candidate)) return candidate;
    }
  }

  return "unknown";
}

/**
 * Loose plausibility check for an IPv4 / IPv6 address. Not a full RFC
 * validator — just enough to reject obviously-bogus right-most entries
 * (empty segments, garbage tokens) so we don't bucket on junk. An IPv4
 * dotted quad with each octet 0–255, or anything containing a colon
 * (IPv6, incl. zone/compressed forms) made only of hex digits and `:`.
 */
function isPlausibleIp(value: string): boolean {
  // IPv6: hex groups separated by colons (covers `::` compressed form).
  if (value.includes(":")) {
    return /^[0-9a-fA-F:]+$/.test(value);
  }
  // IPv4: four 0–255 octets.
  const octets = value.split(".");
  if (octets.length !== 4) return false;
  return octets.every((o) => {
    if (!/^\d{1,3}$/.test(o)) return false;
    const n = Number(o);
    return n >= 0 && n <= 255;
  });
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
