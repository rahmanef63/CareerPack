/**
 * Cross-domain URL allowlist helper.
 *
 * Shared so each Convex domain can sanitise a user-supplied link target
 * (e.g. `notifications.actionUrl`) without importing across domain folders.
 * Mirrors the SAME logic as `profile/blocks/helpers.sanitizeUrl`: keep only
 * `http(s):`, root-relative (`/...`), and `#anchor` values; drop
 * `javascript:` / `data:` / `file:` / `vbscript:` / any other scheme.
 *
 * Browsers strip C0 control whitespace (tab, newline, CR, form-feed,
 * vertical-tab) AND internal spaces out of a URL scheme at click/parse time
 * per the HTML/URL spec, so `java<TAB>script:` resolves to a live
 * javascript: URL. The scheme check therefore collapses that whitespace out
 * of the candidate scheme prefix before comparing (same fix as the block
 * sanitiser), otherwise a literal-token comparison is trivially defeated.
 */

// Max length kept in sync with profile/blocks MAX_URL_LEN (no cross-domain
// import — domains own their own constants).
const MAX_ACTION_URL_LEN = 500;

const DANGEROUS_PROTO = /^(?:javascript|vbscript|data|file):/i;

function trimSafe(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  // Strip C0 control chars + DEL but preserve tabs/newlines/CR + visible
  // content (so prose/anchor text is not mangled before the scheme check).
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, max);
}

function dewhitespaceScheme(s: string): string {
  // Only the candidate scheme prefix matters (everything up to and incl. the
  // first ':'); collapse all whitespace there so a split scheme is exposed.
  const colon = s.indexOf(":");
  if (colon === -1) return s;
  const prefix = s.slice(0, colon + 1).replace(/[\s\x00-\x1F]/g, "");
  return prefix + s.slice(colon + 1);
}

function hasDangerousScheme(s: string): boolean {
  return DANGEROUS_PROTO.test(dewhitespaceScheme(s));
}

/**
 * Returns a safe URL string, or `""` if the input is unsafe/empty. Keeps
 * `http(s):`, `/`-rooted, and `#`-anchor values; everything else (including
 * whitespace-split `javascript:` schemes) is rejected.
 */
export function sanitizeActionUrl(
  input: unknown,
  max: number = MAX_ACTION_URL_LEN,
): string {
  const s = trimSafe(input, max);
  if (!s) return "";
  if (hasDangerousScheme(s)) return "";
  // Protocol-relative (`//evil.com`) and slash-backslash (`/\evil.com`,
  // which browsers normalise to `//evil.com`) values start with `/` but
  // resolve OFF-origin — an open-redirect. Accept a root-relative value only
  // when it is a single `/` NOT followed by another `/` or a backslash.
  if (/^\/[/\\]/.test(s)) return "";
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
