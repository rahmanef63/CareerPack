/**
 * Theme preset loader — sources theme definitions from
 * `/r/registry.json` which is a verbatim copy of the tweakcn theme
 * registry.
 *
 * Architecture:
 *
 *   1. Fetch registry.json once, cache in module state.
 *   2. Build a CSS block: `:root { --x: …; }` + `.dark { --x: …; }`.
 *   3. Inject as a single `<style id="theme-preset-vars">` tag in <head>.
 *      One DOM write per apply; easier to wipe; cleaner DevTools than
 *      40+ inline-style properties.
 *   4. Pulse a `html.theme-transition` class for 260 ms around every
 *      swap so an accompanying CSS rule animates background / color /
 *      border / radius / shadow / letter-spacing / font-family.
 *   5. Three entry points:
 *        applyPreset(name)   — commit + persist to localStorage
 *        previewPreset(name) — apply without persisting (hover)
 *        restoreSavedPreset() — re-apply the saved preset (mouse leave)
 *   6. Color values arrive as `oklch(L C H)` strings; we strip the
 *      wrapper so they match Tailwind's `oklch(var(--x) / <alpha-value>)`
 *      pattern and slash utilities resolve correctly.
 *   7. Fonts route through `resolveFontStack` so loaded next/font
 *      variables get prepended when the preset's primary family matches.
 */

import { rewriteFontValue } from "./registryFonts";

/** Alias kept for readability with the helpers below. */
const resolveFontStack = rewriteFontValue;

const STORAGE_KEY = "careerpack:theme-preset";
const STYLE_ID = "theme-preset-vars";
const TRANSITION_CLASS = "theme-transition";
const TRANSITION_MS = 260;
const REGISTRY_URL = "/r/registry.json";

export const DEFAULT_PRESET_NAME = "modern-minimal";

// ---------------------------------------------------------------------------
// Registry shapes
// ---------------------------------------------------------------------------

export interface ThemePresetItem {
  name: string;
  title: string;
  type?: string;
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

// ---------------------------------------------------------------------------
// Token classification — drives how each registry value is emitted.
// ---------------------------------------------------------------------------

const COLOR_TOKENS = [
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
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const;

// Registry uses `sidebar` for the sidebar surface; CareerPack's tailwind
// config references `--sidebar-background`. Emit both so either name
// resolves correctly.
const COLOR_ALIAS: Readonly<Record<string, string>> = {
  sidebar: "sidebar-background",
};

const PASSTHROUGH_TOKENS = [
  "radius",
  "spacing",
  "letter-spacing",
  "tracking-normal",
  "tracking-tight",
  "tracking-tighter",
  "tracking-wide",
  "tracking-wider",
  "tracking-widest",
  "shadow-color",
  "shadow-opacity",
  "shadow-blur",
  "shadow-spread",
  "shadow-offset-x",
  "shadow-offset-y",
  "shadow-2xs",
  "shadow-xs",
  "shadow-sm",
  "shadow",
  "shadow-md",
  "shadow-lg",
  "shadow-xl",
  "shadow-2xl",
] as const;

const FONT_TOKENS = ["font-sans", "font-serif", "font-mono"] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OKLCH_RX = /^oklch\(\s*([^)]+?)\s*\)\s*$/i;
const HSL_RX = /^hsl\(\s*([^)]+?)\s*\)\s*$/i;

/** Strip `oklch(...)` or `hsl(...)` wrapper so the components compose
 *  with Tailwind's `oklch(var(--x) / <alpha-value>)` pattern. */
function stripColorWrapper(value: string): string {
  const trimmed = value.trim();
  const oklch = trimmed.match(OKLCH_RX);
  if (oklch) return oklch[1].trim();
  const hsl = trimmed.match(HSL_RX);
  if (hsl) return hsl[1].replace(/,/g, " ").trim();
  return trimmed;
}

function buildBlock(
  selector: string,
  vars: Record<string, string>,
): string | null {
  const lines: string[] = [];
  for (const key of COLOR_TOKENS) {
    const v = vars[key];
    if (!v) continue;
    const outKey = COLOR_ALIAS[key] ?? key;
    lines.push(`  --${outKey}: ${stripColorWrapper(v)};`);
    // When aliased, ALSO emit the original name so SVG inline refs
    // (`var(--sidebar)`) still work.
    if (COLOR_ALIAS[key]) {
      lines.push(`  --${key}: ${stripColorWrapper(v)};`);
    }
  }
  for (const key of PASSTHROUGH_TOKENS) {
    const v = vars[key];
    if (v) lines.push(`  --${key}: ${v};`);
  }
  for (const key of FONT_TOKENS) {
    const v = vars[key];
    if (v) lines.push(`  --${key}: ${resolveFontStack(v)};`);
  }
  if (!lines.length) return null;
  return `${selector} {\n${lines.join("\n")}\n}`;
}

function buildBrandBridge(light: Record<string, string>): string | null {
  // Mirror preset primary/chart-4/secondary into CareerPack's `--brand*`
  // aliases so legacy `bg-brand*` callsites follow the active theme.
  const primary = light.primary ? stripColorWrapper(light.primary) : null;
  if (!primary) return null;
  const primaryFg = light["primary-foreground"]
    ? stripColorWrapper(light["primary-foreground"])
    : "1 0 0";
  const brandTo = light["chart-4"]
    ? stripColorWrapper(light["chart-4"])
    : light["chart-2"]
      ? stripColorWrapper(light["chart-2"])
      : light.accent
        ? stripColorWrapper(light.accent)
        : primary;
  const brandMuted = light.secondary
    ? stripColorWrapper(light.secondary)
    : primary;
  const brandMutedFg = light["secondary-foreground"]
    ? stripColorWrapper(light["secondary-foreground"])
    : primaryFg;
  return [
    `:root {`,
    `  --brand: ${primary};`,
    `  --brand-foreground: ${primaryFg};`,
    `  --brand-from: ${primary};`,
    `  --brand-to: ${brandTo};`,
    `  --brand-muted: ${brandMuted};`,
    `  --brand-muted-foreground: ${brandMutedFg};`,
    `}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Registry cache
// ---------------------------------------------------------------------------

let registryCache: ThemeRegistry | null = null;
let registryPromise: Promise<ThemeRegistry> | null = null;

export async function loadRegistry(): Promise<ThemeRegistry> {
  if (registryCache) return registryCache;
  if (registryPromise) return registryPromise;
  registryPromise = fetch(REGISTRY_URL, { cache: "force-cache" })
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

/** 5 signature swatches for dropdown preview. Reads from light cssVars. */
export function presetSwatches(preset: ThemePresetItem): string[] {
  const v = preset.cssVars?.light ?? preset.cssVars?.dark ?? {};
  return [
    v.background ?? "oklch(1 0 0)",
    v.foreground ?? "oklch(0 0 0)",
    v.primary ?? "oklch(0.5 0.1 259)",
    v.accent ?? "oklch(0.5 0.1 200)",
    v.destructive ?? "oklch(0.6 0.2 25)",
  ];
}

// ---------------------------------------------------------------------------
// Style tag + transition pulse
// ---------------------------------------------------------------------------

function injectStyleTag(css: string): void {
  if (typeof document === "undefined") return;
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

function removeStyleTag(): void {
  if (typeof document === "undefined") return;
  document.getElementById(STYLE_ID)?.remove();
}

let transitionTimer: ReturnType<typeof setTimeout> | null = null;

function pulseTransition(): void {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.classList.add(TRANSITION_CLASS);
  if (transitionTimer) clearTimeout(transitionTimer);
  transitionTimer = setTimeout(() => {
    el.classList.remove(TRANSITION_CLASS);
    transitionTimer = null;
  }, TRANSITION_MS);
}

// ---------------------------------------------------------------------------
// Apply / preview / restore
// ---------------------------------------------------------------------------

async function writeVars(name: string): Promise<void> {
  const reg = await loadRegistry();
  const preset = findPreset(reg, name);
  if (!preset) return;
  const blocks: string[] = [];
  const theme = preset.cssVars?.theme;
  const light = preset.cssVars?.light;
  const dark = preset.cssVars?.dark;
  if (theme) {
    const b = buildBlock(":root", theme);
    if (b) blocks.push(b);
  }
  if (light) {
    const b = buildBlock(":root", light);
    if (b) blocks.push(b);
    const bridge = buildBrandBridge(light);
    if (bridge) blocks.push(bridge);
  }
  if (dark) {
    const b = buildBlock(".dark", dark);
    if (b) blocks.push(b);
  }
  injectStyleTag(blocks.join("\n\n"));
}

/** Commit preset: apply vars + persist to localStorage. */
export async function applyPreset(name: string | null): Promise<void> {
  pulseTransition();
  if (!name || name === DEFAULT_PRESET_NAME) {
    removeStyleTag();
    try {
      if (name === DEFAULT_PRESET_NAME) {
        localStorage.setItem(STORAGE_KEY, name);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
    return;
  }
  await writeVars(name);
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // ignore
  }
}

/** Preview preset: apply vars, skip persistence. Use on hover. */
export async function previewPreset(name: string | null): Promise<void> {
  pulseTransition();
  if (!name || name === DEFAULT_PRESET_NAME) {
    removeStyleTag();
    return;
  }
  await writeVars(name);
}

/** Re-apply the saved preset (or clear if none). Use on dropdown mouse
 *  leave / outside click. */
export async function restoreSavedPreset(): Promise<void> {
  const saved = getSavedPreset();
  pulseTransition();
  if (!saved || saved === DEFAULT_PRESET_NAME) {
    removeStyleTag();
    return;
  }
  await writeVars(saved);
}

export function getSavedPreset(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Boot: re-apply the saved preset on page load. Call once from the
 *  provider after mount. */
export async function bootPreset(): Promise<void> {
  const saved = getSavedPreset();
  if (!saved || saved === DEFAULT_PRESET_NAME) return;
  await writeVars(saved);
}
