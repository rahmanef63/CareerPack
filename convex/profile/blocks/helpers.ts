/**
 * URL sanitisation for the public branding page.
 *
 * The canonical allowlist lives in convex/_shared/url.ts so this domain
 * helper and the notifications domain cannot drift; this file is the
 * profile-domain re-export plus its regression suite (helpers.test.ts).
 *
 * The HTML stripper and the embed-URL parser that used to live here went with
 * the block builder — they sanitised block payloads, and blocks are gone.
 * Custom page HTML is NOT sanitised: it renders in a sandboxed srcdoc iframe
 * with no same-origin access, which is a stronger boundary than a regex
 * stripper ever was. See convex/profile/publicHtml.ts.
 */

// Canonical sanitizer core lives in convex/_shared so this domain helper and
// the notifications domain (`_shared/url.sanitizeActionUrl`) cannot drift.
// Sharing via _shared is the allowed cross-domain path. Re-exported below so
// the existing `from "./helpers"` import sites (blocks.ts, header.ts) keep
// resolving unchanged.
import { MAX_URL_LEN, sanitizeUrlCore, trimSafe } from "../../_shared/url";

export { trimSafe };

export function sanitizeUrl(input: unknown, max: number = MAX_URL_LEN): string {
  return sanitizeUrlCore(input, max);
}
