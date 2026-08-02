/**
 * CSRF defence for state-changing httpActions.
 *
 * Without this an attacker page can `fetch('/api/password-reset/request',
 * { mode: 'no-cors', method: 'POST', body: ... })` from any origin and
 * spam reset emails to harvested addresses (or repeatedly trigger our
 * Resend / rate-limit budget). CORS doesn't stop the request — it stops
 * the attacker reading the *response*. Origin check at request entry
 * does stop it.
 *
 * Allow-list:
 *   - APP_URL                    (prod)
 *   - http://localhost:3000      (dev)
 *   - http://127.0.0.1:3000      (dev)
 *
 * Allow `OPTIONS` (preflight) regardless — actual gate runs on the POST.
 */

const DEV_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (DEV_ORIGINS.has(origin)) return true;
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    const trimmed = appUrl.replace(/\/$/, "");
    if (origin === trimmed) return true;
  }
  return false;
}

/**
 * Returns null when the request is allowed to proceed, or a 403
 * Response when it should be rejected. Caller composes with their
 * existing CORS headers.
 */
export function rejectIfBadOrigin(
  request: Request,
  corsHeaders: Record<string, string>,
): Response | null {
  if (request.method === "OPTIONS") return null;
  const origin = request.headers.get("origin");
  if (isAllowedOrigin(origin)) return null;
  return new Response("forbidden_origin", { status: 403, headers: corsHeaders });
}
