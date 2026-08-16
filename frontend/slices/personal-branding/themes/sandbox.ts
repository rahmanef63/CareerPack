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

/**
 * A user-authored document (`userProfiles.publicHtml`) — written by the page's
 * owner, or by an AI host acting for them, and stored unsanitised.
 *
 * Same as above minus `allow-forms`. A form is the one abuse the rest of the
 * stack does not already neutralise: scripts cannot exfiltrate (the app CSP
 * pins `connect-src` and `img-src` to an allowlist, and an about:srcdoc frame
 * inherits it) and cannot navigate the top frame (no `allow-top-navigation`),
 * but a login-looking form served from careerpack.org/<slug> would be cheap,
 * convincing phishing. No personal page needs to collect input.
 *
 * `allow-popups-to-escape-sandbox` stays: without it every outbound link the
 * user puts on their page — "lihat proyek", LinkedIn — opens into an opaque
 * origin where the destination has no cookies and half of them break.
 */
export const SANDBOX_CUSTOM =
  "allow-scripts allow-popups allow-popups-to-escape-sandbox";
