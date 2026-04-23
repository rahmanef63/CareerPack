/**
 * Theme preset loader — sources theme definitions from
 * `/r/registry.json` which is a verbatim copy of the tweakcn theme
 * registry bundled with superspace (see /home/rahman/projects/superspace/
 * public/r/registry.json, read-only reference).
 *
 * Registry format:
 *   { items: [{ name, title, cssVars: { theme, light, dark }, ... }] }
 *
 * Each `cssVars.{light|dark}` block stores values in oklch(...) or hex
 * strings. CareerPack's tailwind.config uses `hsl(var(--*) / <alpha-value>)`
 * patterns everywhere, so we parse oklch via the browser and re-emit as
 * HSL components ("H S% L%") before applying. Non-color tokens (radius,
 * font-*, tracking-*, shadow-*) pass through unchanged.
 */

export interface ThemePresetItem {
  name: string;
  title: string;
  description?: string;
  cssVars?: {
    theme?: Record<string, string>;
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
}

export interface ThemeRegistry {
  name: string;
  items: ThemePresetItem[];
}

export const DEFAULT_PRESET_NAME = "modern-minimal";

let registryCache: ThemeRegistry | null = null;
let registryPromise: Promise<ThemeRegistry> | null = null;

export async function loadRegistry(): Promise<ThemeRegistry> {
  if (registryCache) return registryCache;
  if (registryPromise) return registryPromise;
  registryPromise = fetch("/r/registry.json")
    .then((r) => {
      if (!r.ok) throw new Error(`registry.json ${r.status}`);
      return r.json() as Promise<ThemeRegistry>;
    })
    .then((data) => {
      // Filter to only usable style items (first entry is the registry
      // header, not a theme).
      const items = data.items.filter(
        (i) => i.cssVars?.light && i.cssVars?.dark,
      );
      registryCache = { ...data, items };
      return registryCache;
    });
  return registryPromise;
}

export function findPreset(
  registry: ThemeRegistry,
  name: string,
): ThemePresetItem | undefined {
  return registry.items.find((i) => i.name === name);
}

// -----------------------------------------------------------------------------
// OKLCH → HSL conversion via the browser's computed color space. Avoids a
// dedicated color library; works in all browsers that support oklch() which
// is a superset of the browsers that run CareerPack (Chrome 111+, Firefox
// 113+, Safari 15.4+).
// -----------------------------------------------------------------------------

const hslCache = new Map<string, string>();

function parseRgb(rgbStr: string): [number, number, number, number] {
  const m = rgbStr.match(
    /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[\s/,]+([\d.]+))?/,
  );
  if (!m) return [0, 0, 0, 1];
  return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3]), m[4] ? parseFloat(m[4]) : 1];
}

function rgbToHslComponents(r: number, g: number, b: number): string {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function toHslComponents(value: string): string {
  const cached = hslCache.get(value);
  if (cached) return cached;
  if (typeof document === "undefined") return value; // SSR safety; apply runs client-side anyway

  const probe = document.createElement("div");
  probe.style.color = value;
  probe.style.display = "none";
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  document.body.removeChild(probe);

  if (!computed.startsWith("rgb")) {
    hslCache.set(value, value);
    return value;
  }
  const [r, g, b] = parseRgb(computed);
  const out = rgbToHslComponents(r, g, b);
  hslCache.set(value, out);
  return out;
}

// CSS vars that should be converted to HSL-component format so they stay
// compatible with `hsl(var(--x) / <alpha-value>)` in tailwind config.
// Includes both the registry name (`sidebar`) and the CareerPack target
// name (`sidebar-background`) so `convertValue` catches either input.
const COLOR_VAR_NAMES = new Set([
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "success",
  "success-foreground",
  "warning",
  "warning-foreground",
  "info",
  "info-foreground",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",              // registry key (gets aliased to sidebar-background)
  "sidebar-background",   // CareerPack target alias
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
  "brand",
  "brand-foreground",
  "brand-from",
  "brand-to",
  "brand-muted",
  "brand-muted-foreground",
  // Shadow color is stored as raw HSL components so `hsl(var(--shadow-color)
  // / 0.10)` in index.css composes correctly. Registry ships it wrapped
  // in hsl() — convertValue strips the wrapper.
  "shadow-color",
]);

// Alias mapping: registry uses `sidebar` (no suffix) to mean sidebar bg.
// CareerPack's tailwind config references `--sidebar-background`.
const SIDEBAR_BG_KEY = "sidebar";
const SIDEBAR_BG_TARGET = "sidebar-background";

function convertValue(key: string, value: string): string {
  if (!COLOR_VAR_NAMES.has(key) && !COLOR_VAR_NAMES.has(targetKeyFor(key))) {
    return value;
  }
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed.startsWith("oklch(") || trimmed.startsWith("rgb(") || trimmed.startsWith("rgba(") || trimmed.startsWith("#")) {
    return toHslComponents(trimmed);
  }
  // hsl(...) wrapper → strip to components
  const hslMatch = trimmed.match(/^hsl\(([^)]+)\)$/i);
  if (hslMatch) return hslMatch[1].replace(/,/g, " ").trim();
  return value;
}

function targetKeyFor(registryKey: string): string {
  if (registryKey === SIDEBAR_BG_KEY) return SIDEBAR_BG_TARGET;
  return registryKey;
}

export function applyPreset(
  preset: ThemePresetItem,
  mode: "light" | "dark",
): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const themeVars = preset.cssVars?.theme ?? {};
  const modeVars = preset.cssVars?.[mode] ?? {};

  // Theme-level tokens (radius, fonts, tracking, shadows) — pass through.
  for (const [key, raw] of Object.entries(themeVars)) {
    root.style.setProperty(`--${key}`, raw);
  }

  // Mode tokens — convert colors to HSL components for tailwind alpha compat.
  const resolved: Record<string, string> = {};
  for (const [rawKey, raw] of Object.entries(modeVars)) {
    const key = targetKeyFor(rawKey);
    const value = convertValue(rawKey, raw);
    root.style.setProperty(`--${key}`, value);
    resolved[key] = value;
  }

  // Bridge registry → CareerPack's `--brand*` aliases so legacy
  // `bg-brand*`, `from-brand-from`, etc. track the active preset's
  // primary/accent rather than the stale values from index.css.
  if (resolved["primary"]) {
    root.style.setProperty("--brand", resolved["primary"]);
    root.style.setProperty("--brand-from", resolved["primary"]);
  }
  if (resolved["primary-foreground"]) {
    root.style.setProperty("--brand-foreground", resolved["primary-foreground"]);
  }
  // brand-to: prefer chart-4 (visually distinct complement) → chart-2 → accent.
  const brandToSrc =
    resolved["chart-4"] ?? resolved["chart-2"] ?? resolved["accent"];
  if (brandToSrc) {
    root.style.setProperty("--brand-to", brandToSrc);
  }
  // brand-muted / -muted-foreground: derive from secondary (light chip surface).
  if (resolved["secondary"]) {
    root.style.setProperty("--brand-muted", resolved["secondary"]);
  }
  if (resolved["secondary-foreground"]) {
    root.style.setProperty(
      "--brand-muted-foreground",
      resolved["secondary-foreground"],
    );
  }
}

export function clearInlinePreset(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  // Strip all inline custom-property overrides so the base stylesheet's
  // defaults take over. Iterate the element's own style declarations only.
  const names: string[] = [];
  for (let i = 0; i < root.style.length; i++) {
    const n = root.style[i];
    if (n.startsWith("--")) names.push(n);
  }
  for (const n of names) root.style.removeProperty(n);
}
