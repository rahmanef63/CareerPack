import type { LucideIcon } from "lucide-react";

/**
 * Data shapes for the landing "Toolkit" section — a 4-category grid sourced
 * from the real dashboard nav registry (`dashboardRegistry.ts`), never
 * invented copy. Content (constants/) and presentation (config/) are typed
 * separately, then merged by `hooks/useToolkitCategories.ts` into the
 * render-ready shapes at the bottom of this file.
 */

/** The 4 fixed marketing groupings, in display order. */
export type ToolkitCategoryId =
  | "persiapan"
  | "melamar"
  | "berkembang"
  | "karier-jangka-panjang";

/** Authored 1-line description for one registry feature inside a category. */
export interface ToolkitFeatureCopy {
  /** Matches a `MORE_APPS` / `PRIMARY_NAV` id in `dashboardRegistry.ts`. */
  registryId: string;
  description: string;
}

/** Indonesian copy for one category — no color/icon here, content only. */
export interface ToolkitCategoryContent {
  id: ToolkitCategoryId;
  title: string;
  tagline: string;
  /** Honest, number-free closing line shown in the tinted tip box. */
  tip: string;
  features: ToolkitFeatureCopy[];
}

/** Presentation-only accent classes for one category, keyed by id. */
export interface ToolkitCategoryAccent {
  icon: LucideIcon;
  /** Category + per-feature icon chip, e.g. "bg-primary". */
  chipClassName: string;
  /** Tinted tip-box background + text, e.g. "bg-primary/10 text-primary". */
  tipClassName: string;
  /** Card border-hover accent, e.g. "hover:border-primary". Must be a
   * full literal string here (and nowhere derived at runtime) so Tailwind's
   * JIT scanner can find it. */
  hoverBorderClassName: string;
}

/** One feature row after merging registry data (label/icon/href/badge) + authored copy. */
export interface ToolkitFeature {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
  badge?: string;
}

/** One category card, fully merged and ready to render. */
export interface ToolkitCategory {
  id: ToolkitCategoryId;
  title: string;
  tagline: string;
  tip: string;
  icon: LucideIcon;
  chipClassName: string;
  tipClassName: string;
  hoverBorderClassName: string;
  features: ToolkitFeature[];
}

/** Authored copy for one trust-strip cell (icon added separately in config/). */
export interface TrustStripContent {
  id: string;
  title: string;
  description: string;
}

/** One trust-strip cell after merging content + icon. */
export interface TrustStripItem extends TrustStripContent {
  icon: LucideIcon;
}
