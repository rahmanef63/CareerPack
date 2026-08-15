/**
 * Custom public-page HTML — the one shared rule set for both write paths
 * (the dashboard's `updateMyPublicProfile` and MCP's `branding_set_html`),
 * so a limit can't be enforced in one and not the other.
 *
 * There is deliberately no sanitiser here. The document is rendered in the
 * same sandboxed `srcdoc` iframe as the built-in templates — `allow-scripts`
 * WITHOUT `allow-same-origin`, so it lives in an opaque origin with no access
 * to the app's DOM, cookies, or Convex session. Stripping tags would only
 * break the templates (which need their own inline scripts to run) while
 * buying nothing the sandbox doesn't already give.
 *
 * What the sandbox does NOT stop: the page still renders under
 * careerpack.org/<slug>, so a determined user can put convincing content
 * there, same as any host of user pages. `allow-forms` is withheld for custom
 * documents (TemplateLayout.tsx) so it cannot at least collect input, and the
 * page is only reachable once the user publishes it from the dashboard —
 * which is why MCP has no publish tool.
 *
 * ponytail: size cap only. If a page ever renders OUTSIDE that iframe, this
 * is the place a real sanitiser goes, and every caller picks it up.
 */

/** ~250 KB. The largest built-in template is 81 KB, so this is generous. */
export const PUBLIC_HTML_MAX = 250_000;

/**
 * Normalise a custom-HTML write. `null` / `""` / whitespace clears the field
 * (falls back to the built-in template); anything else is stored verbatim.
 * Throws the app's Indonesian error when over the cap.
 */
export function normalizePublicHtml(raw: string | null): string | undefined {
  if (raw === null) return undefined;
  const html = raw.trim();
  if (html.length === 0) return undefined;
  if (html.length > PUBLIC_HTML_MAX) {
    throw new Error(
      `HTML terlalu besar (${html.length} karakter, maksimal ${PUBLIC_HTML_MAX})`,
    );
  }
  return html;
}
