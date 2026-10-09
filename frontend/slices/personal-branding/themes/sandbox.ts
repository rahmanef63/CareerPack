/**
 * Iframe sandbox policy for the public branding page.
 *
 * Its own module rather than a constant inside TemplateLayout.tsx for one
 * boring reason: the test runner cannot parse a `.tsx` file, and a security
 * boundary that cannot be asserted on is a security boundary that drifts.
 * See sandbox.test.ts.
 */

/**
 * A built-in template file — markup we wrote and ship.
 *
 * `allow-same-origin` is absent, and that is the flag that matters: without
 * it the frame gets an opaque origin, so nothing inside can reach the app's
 * DOM, cookies, localStorage or Convex session, whatever it runs.
 */
export const SANDBOX_TEMPLATE =
  "allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms";

/** User-authored documents cannot escape their sandbox via popups. */
export const SANDBOX_CUSTOM = "allow-scripts allow-popups";
