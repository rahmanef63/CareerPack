import { useMemo } from "react";
import type { FloatingNavItem } from "./types";

/**
 * SVG sanitisation allowlist. `iconHtml` arrives via postMessage from
 * the sandboxed template iframe (origin "null") and is rendered here on
 * the MAIN app origin via dangerouslySetInnerHTML — so it MUST be
 * scrubbed even though shipped templates only emit static developer
 * SVGs. We keep a minimal set of inline-SVG elements + presentational
 * attributes and drop everything else (scripts, event handlers, foreign
 * tags, url()/javascript: refs).
 */
const ALLOWED_SVG_TAGS = new Set([
  "svg",
  "path",
  "g",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
  "ellipse",
]);

const ALLOWED_SVG_ATTRS = new Set([
  "viewbox",
  "fill",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "d",
  "aria-hidden",
  "class",
  // Geometry primitives used by the allowed shape elements above.
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "width",
  "height",
  "points",
]);

/**
 * Reduce arbitrary iframe-extracted markup to a single safe inline
 * `<svg>`. Parses in an inert document, walks the tree, and rebuilds
 * only allowlisted elements/attributes. Any attribute whose value
 * smuggles `javascript:` or `url(` is dropped. Returns `""` (caller
 * falls back to an empty placeholder) when nothing safe remains.
 */
function sanitizeIconHtml(raw: string): string {
  if (!raw) return "";
  // DOMParser is browser-only; this nav only renders client-side, but
  // guard SSR/test environments defensively.
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return "";
  }
  let parsed: Document;
  try {
    // Parse as HTML (forgiving — no xmlns requirement). The browser
    // builds real SVG elements for <svg>/<path>/… inside the body, and
    // crucially does NOT execute scripts or load resources from a
    // DOMParser document.
    parsed = new DOMParser().parseFromString(raw, "text/html");
  } catch {
    return "";
  }
  const svg = parsed.body.querySelector("svg");
  if (!svg) return "";

  const out = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  function copyAttrs(from: Element, to: Element) {
    for (const attr of Array.from(from.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on")) continue; // event handlers
      if (!ALLOWED_SVG_ATTRS.has(name)) continue;
      const value = attr.value;
      if (/javascript:|url\(/i.test(value)) continue;
      to.setAttribute(attr.name, value);
    }
  }

  function rebuild(node: Element): Element | null {
    const tag = node.tagName.toLowerCase();
    if (!ALLOWED_SVG_TAGS.has(tag)) return null;
    const clone = document.createElementNS(
      "http://www.w3.org/2000/svg",
      tag,
    );
    copyAttrs(node, clone);
    for (const child of Array.from(node.children)) {
      const rebuilt = rebuild(child);
      if (rebuilt) clone.appendChild(rebuilt);
    }
    return clone;
  }

  copyAttrs(svg, out);
  for (const child of Array.from(svg.children)) {
    const rebuilt = rebuild(child);
    if (rebuilt) out.appendChild(rebuilt);
  }
  return out.outerHTML;
}

/**
 * Viewport-fixed mobile bottom nav rendered OUTSIDE the iframe so its
 * `position: fixed` actually pins to the user's viewport. Clicks
 * postMessage `cp-goto` into the iframe, which echoes back the
 * target's y-offset; the parent then smooth-scrolls itself.
 */
export function FloatingMobileNav({
  items,
  onSelect,
}: {
  items: ReadonlyArray<FloatingNavItem>;
  onSelect: (id: string) => void;
}) {
  // Sanitise every icon once per items change. Maps item id → safe SVG
  // (or "" when nothing safe survives the allowlist).
  const safeIcons = useMemo(
    () => items.map((item) => sanitizeIconHtml(item.iconHtml)),
    [items],
  );
  return (
    <nav
      aria-label="Navigasi cepat"
      className="fixed inset-x-3 bottom-3 z-50 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul
        className="grid gap-1 rounded-2xl border border-border bg-background/85 p-1.5 shadow-lg backdrop-blur"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item, i) => {
          const icon = safeIcons[i];
          return (
            <li key={item.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className="flex w-full flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:bg-accent"
              >
                {icon ? (
                  <span
                    className="block h-5 w-5 [&_svg]:h-5 [&_svg]:w-5"
                    // Iframe-extracted SVG markup, scrubbed through
                    // sanitizeIconHtml (svg/path allowlist, no event
                    // handlers, no foreign tags) before it touches the
                    // MAIN-origin DOM. See the allowlist above.
                    dangerouslySetInnerHTML={{ __html: icon }}
                  />
                ) : (
                  <span className="block h-5 w-5" aria-hidden />
                )}
                <span className="truncate leading-tight">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
