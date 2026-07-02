import { MORE_APPS, PRIMARY_NAV } from "@/shared/lib/dashboardRegistry";
import { TOOLKIT_CATEGORIES } from "../constants/categories";
import {
  TOOLKIT_CATEGORY_ACCENTS,
  TOOLKIT_REVEAL_STEP_SECONDS,
} from "../config/toolkit.config";
import type { ToolkitCategory, ToolkitFeature } from "../types/toolkit.types";

interface RegistryLookupEntry {
  label: string;
  icon: ToolkitFeature["icon"];
  href: string;
  badge?: string;
}

/**
 * Real label/icon/href/badge per nav id, sourced from the SSOT dashboard
 * registry — never hand-typed, so this section can't drift from the real
 * app nav.
 */
const REGISTRY_LOOKUP: Record<string, RegistryLookupEntry> = Object.fromEntries(
  [...PRIMARY_NAV, ...MORE_APPS].map((item) => {
    const entry: RegistryLookupEntry = {
      label: item.label,
      icon: item.icon,
      href: item.href,
    };
    if ("badge" in item && item.badge) entry.badge = item.badge;
    return [item.id, entry];
  })
);

export interface UseToolkitCategoriesResult {
  categories: ToolkitCategory[];
  /** Inline style for staggered scroll-reveal, `n` = 0-based element order. */
  revealDelay: (n: number) => { animationDelay: string };
}

/**
 * Single data-access seam for ToolkitSection: merges the authored category
 * copy (constants/), the real registry data (label/icon/href/badge), and the
 * presentation accents (config/) into render-ready category cards.
 */
export function useToolkitCategories(): UseToolkitCategoriesResult {
  const categories: ToolkitCategory[] = TOOLKIT_CATEGORIES.map((category) => {
    const accent = TOOLKIT_CATEGORY_ACCENTS[category.id];

    const features: ToolkitFeature[] = category.features.flatMap((featureCopy) => {
      const registryItem = REGISTRY_LOOKUP[featureCopy.registryId];
      // Should never happen (ids are hand-verified against the registry
      // above), but skip gracefully rather than crash the landing page.
      if (!registryItem) return [];

      const feature: ToolkitFeature = {
        id: featureCopy.registryId,
        label: registryItem.label,
        description: featureCopy.description,
        icon: registryItem.icon,
        href: registryItem.href,
      };
      if (registryItem.badge) feature.badge = registryItem.badge;
      return [feature];
    });

    return {
      id: category.id,
      title: category.title,
      tagline: category.tagline,
      tip: category.tip,
      icon: accent.icon,
      chipClassName: accent.chipClassName,
      tipClassName: accent.tipClassName,
      hoverBorderClassName: accent.hoverBorderClassName,
      features,
    };
  });

  const revealDelay = (n: number) => ({
    animationDelay: `${(n * TOOLKIT_REVEAL_STEP_SECONDS).toFixed(1)}s`,
  });

  return { categories, revealDelay };
}
