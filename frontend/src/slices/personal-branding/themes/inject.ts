import {
  TEMPLATE_HYDRATOR_JS,
  TEMPLATE_IFRAME_HELPERS_JS,
} from "./templateHydrator";
import type { BrandingPayload } from "./types";

/**
 * Splice branding payload + hydrator script into the template HTML.
 * Injects right before `</body>` so it runs after the template's own
 * markup is parsed but before `DOMContentLoaded` fires for the
 * template's own scripts (which we want — hydration must happen
 * before any of those scripts measure layout / animate sections that
 * we may end up hiding).
 *
 * If `branding` is omitted, the template renders its hardcoded mock
 * content (still useful for the picker preview thumbnails).
 */
export function injectBrandingIntoHtml(
  html: string,
  branding?: BrandingPayload,
): string {
  let result = html;
  // Always-injected helpers (anchor nav + auto-resize). Run regardless
  // of whether real branding is present so the mock-content "Tampilkan
  // Template" tab also resizes correctly and has working in-iframe nav.
  const helpersScript = `\n<script>${TEMPLATE_IFRAME_HELPERS_JS}</script>\n`;

  if (!branding) {
    if (result.includes("</body>")) {
      result = result.replace("</body>", `${helpersScript}</body>`);
    } else if (result.includes("</html>")) {
      result = result.replace("</html>", `${helpersScript}</html>`);
    } else {
      result += helpersScript;
    }
    return result;
  }
  // Stringify safely — avoid `</script>` collisions and HTML-escape
  // unicode line/paragraph separators that JSON.stringify outputs raw.
  const json = JSON.stringify(branding)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  const dataScript = `\n<script id="__cp_data" type="application/json">${json}</script>\n`;
  const hydratorScript = `\n<script>${TEMPLATE_HYDRATOR_JS}</script>\n`;

  // Data must come BEFORE the template's own inline scripts so per-
  // template mounts (e.g. v2's casesMount, skillsMount) can read it
  // when they execute. Splice into end of <head>.
  if (result.includes("</head>")) {
    result = result.replace("</head>", `${dataScript}</head>`);
  } else {
    result = `${dataScript}${result}`;
  }

  // Helpers + hydrator run last — fills slots, hides empty sections,
  // wires anchor nav + iframe auto-resize.
  const tail = `${helpersScript}${hydratorScript}`;
  if (result.includes("</body>")) {
    result = result.replace("</body>", `${tail}</body>`);
  } else if (result.includes("</html>")) {
    result = result.replace("</html>", `${tail}</html>`);
  } else {
    result = result + tail;
  }
  return result;
}
