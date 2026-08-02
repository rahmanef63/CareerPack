/**
 * Cross-domain URL allowlist helper — the CANONICAL sanitizer core.
 *
 * Shared so each Convex domain can sanitise a user-supplied link target
 * (e.g. `notifications.actionUrl`, personal-branding block links) without
 * duplicating the allowlist logic across domain folders. `profile/blocks/
 * helpers.ts` imports `sanitizeUrlCore` (+ `trimSafe` / `hasDangerousScheme`)
 * from here and re-exports it as `sanitizeUrl`, so the two cannot drift.
 *
 * Allowlist: keep only `http(s):`, root-relative (`/...`), and `#anchor`
 * values; drop `javascript:` / `data:` / `file:` / `vbscript:` / any other
 * scheme, plus protocol-relative / off-origin slash variants.
 *
 * Browsers strip C0 control whitespace (tab, newline, CR, form-feed,
 * vertical-tab) AND internal spaces out of a URL at click/parse time per the
 * HTML/URL spec, so `java<TAB>script:` resolves to a live javascript: URL and
 * `/<TAB>/evil.com` collapses to a protocol-relative `//evil.com`. trimSafe
 * deliberately keeps tab/newline/CR for prose, so the dangerous-scheme and
 * slash-pair guards run against a de-whitespaced copy of the candidate —
 * otherwise a literal-token comparison is trivially defeated by interior
 * whitespace.
 */

/**
 * Canonical max length for any user-supplied URL across domains. This is the
 * SINGLE source of truth — `profile/blocks/types.ts` re-exports it as
 * `MAX_URL_LEN` instead of redeclaring the literal, so the cap can no longer
 * drift between the notifications and personal-branding sanitisers. Importing
 * from `_shared` is the allowed cross-domain path.
 */
export const MAX_URL_LEN = 500;

// Domain-facing alias kept for the notification call sites' default param.
const MAX_ACTION_URL_LEN = MAX_URL_LEN;

const DANGEROUS_PROTO = /^(?:javascript|vbscript|data|file):/i;

export function trimSafe(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  // Strip C0 control chars + DEL but preserve tabs/newlines/CR + visible
  // content (so prose/anchor text is not mangled before the scheme check).
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, max);
}

// Collapse ALL whitespace + C0 control chars out of a candidate so an
// interior-whitespace token (`/<TAB>/evil.com`, `java<NEWLINE>script:`,
// `/ /evil.com`) is exposed before the structural guards run. Used only for
// the dangerous-scheme / slash-pair *tests*, never for the returned value.
function dewhitespace(s: string): string {
  return s.replace(/[\s\x00-\x1F]/g, "");
}

function dewhitespaceScheme(s: string): string {
  // Only the candidate scheme prefix matters (everything up to and incl. the
  // first ':'); collapse all whitespace there so a split scheme is exposed.
  const colon = s.indexOf(":");
  if (colon === -1) return s;
  const prefix = s.slice(0, colon + 1).replace(/[\s\x00-\x1F]/g, "");
  return prefix + s.slice(colon + 1);
}

export function hasDangerousScheme(s: string): boolean {
  return DANGEROUS_PROTO.test(dewhitespaceScheme(s));
}

/**
 * CANONICAL URL allowlist. Returns a safe URL string, or `""` if the input is
 * unsafe/empty. Keeps `http(s):`, `/`-rooted, and `#`-anchor values;
 * everything else (dangerous schemes incl. whitespace-split, protocol-relative
 * / off-origin slash variants incl. interior-whitespace-split) is rejected.
 */
export function sanitizeUrlCore(input: unknown, max: number): string {
  const s = trimSafe(input, max);
  if (!s) return "";
  if (hasDangerousScheme(s)) return "";
  // Protocol-relative (`//evil.com`) and slash-backslash (`/\evil.com`, which
  // browsers normalise to `//evil.com`) values start with `/` but resolve
  // OFF-origin — an open-redirect. Test a de-whitespaced copy so an interior
  // whitespace token (`/<TAB>/evil.com`, `/ /evil.com`) — which the browser
  // collapses to `//evil.com` at parse time — is rejected too. Accept a
  // root-relative value only when it is a single `/` NOT followed by another
  // `/` or a backslash.
  const collapsed = dewhitespace(s);
  if (/^\/[/\\]/.test(collapsed)) return "";
  if (s.startsWith("/") || s.startsWith("#")) return s;
  if (!/^https?:\/\//i.test(s)) return "";
  try {
    const url = new URL(s);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

/**
 * Domain-facing wrapper for notification action URLs (default max length).
 * Thin alias over `sanitizeUrlCore` so call sites read intent-fully.
 */
export function sanitizeActionUrl(
  input: unknown,
  max: number = MAX_ACTION_URL_LEN,
): string {
  return sanitizeUrlCore(input, max);
}
