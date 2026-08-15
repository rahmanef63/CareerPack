/**
 * Header background + accent sanitisers for the public branding page.
 *
 * This module used to aggregate the whole Personal Branding block system —
 * nine block types, their per-type sanitisers, an HTML stripper and an embed
 * URL parser. The block builder was removed (2026-08-15) in favour of one
 * HTML document per page, and every one of those exports lost its last
 * caller. What survives is the two sanitisers `updateMyPublicProfile` still
 * uses, plus `blocks/helpers.ts` (the URL allowlist they share with
 * `_shared/url.ts`).
 *
 * The file name and import path are kept so `from "./blocks"` call sites do
 * not churn.
 */

export { trimSafe, sanitizeUrl } from "./blocks/helpers";
export {
  HEADER_GRADIENT_PRESETS, sanitizeHeaderBg, sanitizeAccent,
} from "./blocks/header";
