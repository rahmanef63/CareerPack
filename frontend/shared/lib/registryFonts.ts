/**
 * Lookup: first family name from a registry `font-*` value → Next.js
 * font-variable name registered in `app/layout.tsx`.
 *
 * Only fonts covered by next/font are listed. When a preset's font
 * string starts with an unregistered family (e.g., "Courier New"),
 * `rewriteFontValue` leaves the value as-is so the browser falls
 * back to its system chain. Add a new font here + in `layout.tsx`
 * whenever we want to self-host another preset family.
 *
 * Key = case-insensitive family name (exact match on the first
 * token). Value = the CSS variable name Next emits (with `--`
 * prefix dropped for terseness in the map).
 */
export const REGISTRY_FONT_VAR: Readonly<Record<string, string>> = {
  // Sans
  "inter": "font-inter",
  "montserrat": "font-montserrat",
  "poppins": "font-poppins",
  "dm sans": "font-dm-sans",
  "outfit": "font-outfit",
  "open sans": "font-open-sans",
  "plus jakarta sans": "font-plus-jakarta-sans",
  "oxanium": "font-oxanium",
  "quicksand": "font-quicksand",
  "roboto": "font-roboto",
  "geist": "font-geist",

  // Mono
  "jetbrains mono": "font-jetbrains-mono",
  "fira code": "font-fira-code",
  "ibm plex mono": "font-ibm-plex-mono",
  "source code pro": "font-source-code-pro",
  "space mono": "font-space-mono",
  "geist mono": "font-geist-mono",
  "roboto mono": "font-roboto-mono",

  // Serif
  "source serif 4": "font-source-serif-4",
  "lora": "font-lora",
  "merriweather": "font-merriweather",
  "playfair display": "font-playfair-display",
  "libre baskerville": "font-libre-baskerville",
};

/**
 * Parse a registry font string like `"Plus Jakarta Sans, sans-serif"`
 * and, if the first family matches a self-hosted font, prepend a
 * `var(--font-…)` reference so the loaded font wins over the literal
 * family name (which isn't registered outside Next's font manifest).
 *
 * Falls through unchanged when:
 *   - input is not a string
 *   - no family matches the registry
 *   - first token is generic keyword (`ui-sans-serif`, `monospace`, etc.)
 */
export function rewriteFontValue(rawValue: string): string {
  if (typeof rawValue !== "string") return rawValue;
  const trimmed = rawValue.trim();
  if (!trimmed) return rawValue;

  // Split by comma, first entry is the primary family
  const parts = trimmed.split(",");
  const first = parts[0]
    .trim()
    .replace(/^['"]|['"]$/g, "") // strip surrounding quotes
    .toLowerCase();

  const varName = REGISTRY_FONT_VAR[first];
  if (!varName) return rawValue;

  // Prepend var reference so self-hosted font takes priority; retain the
  // original family name (in case next/font's hash changes) and the
  // remaining fallbacks.
  return `var(--${varName}), ${parts.map((p) => p.trim()).join(", ")}`;
}
