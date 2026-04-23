/**
 * Theme preset loader — sources theme definitions from
 * `/r/registry.json` which is a verbatim copy of the tweakcn theme
 * registry bundled with superspace.
 *
 * Approach (mirrors /home/rahman/projects/superspace/frontend/shared/theme/
 * components/layout/active-theme.tsx):
 *
 *   1. Fetch registry.json once, cache in module state.
 *   2. On preset apply, write registry values DIRECTLY to inline CSS
 *      custom properties on documentElement — no color-space conversion.
 *   3. Before applying, strip `oklch(...)` or `hsl(...)` wrappers so
 *      Tailwind's `<alpha-value>` placeholder (set up in tailwind.config
 *      to use `oklch(var(--x) / <alpha-value>)`) can compose alpha
 *      correctly.
 *   4. No conversion to sRGB/HSL — keeps vivid OKLCH colors perceptually
 *      accurate and avoids the gamut-clamping that was desaturating
 *      presets like cosmic-night, catppuccin, bubblegum, etc.
 */

import { rewriteFontValue } from "./registryFonts";

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

// ---------------------------------------------------------------------------
// Wrapper stripper — extracts raw components from an OKLCH or HSL string so
// they can be consumed by tailwind utilities declared as
// `oklch(var(--x) / <alpha-value>)` or `hsl(var(--x) / <alpha-value>)`.
//
//   "oklch(0.62 0.19 259.81)"  →  "0.62 0.19 259.81"
//   "hsl(217 91% 59%)"         →  "217 91% 59%"
//   "0.62 0.19 259.81"         →  "0.62 0.19 259.81"  (already stripped)
//
// Other formats (rgb, hex, named colors) pass through unchanged — they
// shouldn't appear in registry color values, but we don't corrupt them if
// present.
// ---------------------------------------------------------------------------

function stripColorWrapper(value: string): string {
  const trimmed = value.trim();
  const oklch = trimmed.match(/^oklch\(([^)]+)\)$/i);
  if (oklch) return oklch[1].trim();
  const hsl = trimmed.match(/^hsl\(([^)]+)\)$/i);
  if (hsl) return hsl[1].replace(/,/g, " ").trim();
  return trimmed;
}

// Registry keys that hold color values — stripped to components so Tailwind
// can inject alpha. Everything else (radius, fonts, tracking, shadow scale
// strings, shadow primitives) passes through as-is.
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
  "sidebar",
  "sidebar-background",
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
  "shadow-color",
]);

// Alias: registry uses `sidebar` (no suffix) for the sidebar surface;
// CareerPack's tailwind config reads `--sidebar-background`.
const SIDEBAR_BG_KEY = "sidebar";
const SIDEBAR_BG_TARGET = "sidebar-background";

function targetKeyFor(registryKey: string): string {
  if (registryKey === SIDEBAR_BG_KEY) return SIDEBAR_BG_TARGET;
  return registryKey;
}

// Collect every key observed across the registry so `applyPreset` can wipe
// previously-written vars before applying a new preset. Lazily populated —
// first applyPreset call that sees the registry fills this set.
const OBSERVED_KEYS = new Set<string>();

function rememberKeys(preset: ThemePresetItem): void {
  for (const block of ["theme", "light", "dark"] as const) {
    const vars = preset.cssVars?.[block];
    if (!vars) continue;
    for (const key of Object.keys(vars)) {
      OBSERVED_KEYS.add(targetKeyFor(key));
    }
  }
}

export function applyPreset(
  preset: ThemePresetItem,
  mode: "light" | "dark",
  allPresets?: ThemePresetItem[],
): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  rememberKeys(preset);
  if (allPresets) {
    for (const p of allPresets) rememberKeys(p);
  }

  // Wipe every previously-observed custom property so switching between
  // presets doesn't leak stale inline overrides (especially crucial when
  // two presets overlap on some keys but differ on others — without this,
  // a shadow string from preset A could linger under preset B).
  for (const key of OBSERVED_KEYS) {
    root.style.removeProperty(`--${key}`);
    // Brand aliases aren't in the registry; wipe manually.
  }
  for (const brandKey of [
    "brand",
    "brand-foreground",
    "brand-from",
    "brand-to",
    "brand-muted",
    "brand-muted-foreground",
  ]) {
    root.style.removeProperty(`--${brandKey}`);
  }

  const themeVars = preset.cssVars?.theme ?? {};
  const modeVars = preset.cssVars?.[mode] ?? {};

  const writeVar = (rawKey: string, raw: string) => {
    const key = targetKeyFor(rawKey);
    let value: string;
    if (rawKey === "font-sans" || rawKey === "font-mono" || rawKey === "font-serif") {
      value = rewriteFontValue(raw);
    } else if (COLOR_VAR_NAMES.has(rawKey) || COLOR_VAR_NAMES.has(key)) {
      value = stripColorWrapper(raw);
    } else {
      value = raw;
    }
    root.style.setProperty(`--${key}`, value);
    return { key, value };
  };

  // Theme block first (radius, fonts, tracking scale), then mode block
  // (colors, shadows, mode-specific fonts/radius/letter-spacing). Mode
  // wins on overlapping keys, which matches superspace's behavior.
  for (const [key, raw] of Object.entries(themeVars)) writeVar(key, raw);

  const resolved: Record<string, string> = {};
  for (const [rawKey, raw] of Object.entries(modeVars)) {
    const { key, value } = writeVar(rawKey, raw);
    resolved[key] = value;
  }

  // Brand family aliases → primary / chart-4 / secondary so existing
  // `bg-brand*` callsites track the active preset.
  if (resolved["primary"]) {
    root.style.setProperty("--brand", resolved["primary"]);
    root.style.setProperty("--brand-from", resolved["primary"]);
  }
  if (resolved["primary-foreground"]) {
    root.style.setProperty("--brand-foreground", resolved["primary-foreground"]);
  }
  const brandToSrc =
    resolved["chart-4"] ?? resolved["chart-2"] ?? resolved["accent"];
  if (brandToSrc) root.style.setProperty("--brand-to", brandToSrc);
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
  const names: string[] = [];
  for (let i = 0; i < root.style.length; i++) {
    const n = root.style[i];
    if (n.startsWith("--")) names.push(n);
  }
  for (const n of names) root.style.removeProperty(n);
}
