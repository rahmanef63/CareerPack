/** Custom HTML is stored verbatim under a size cap. Render only through
 * TemplateLayout: its opaque iframe and nonce CSP block author scripts,
 * form submissions, network connections and popup escape. */

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
