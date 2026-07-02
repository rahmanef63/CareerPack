import { LayoutGrid, FileText, TrendingUp, type LucideIcon } from "lucide-react";

/**
 * Presentation/behavior config for the Cta section — icon-per-benefit and
 * layout/animation numbers. No Indonesian copy lives here; see
 * constants/cta.constants.ts for content.
 */

/** Icon per right-column benefit row, keyed by CtaBenefit.id. */
export const CTA_BENEFIT_ICONS: Record<string, LucideIcon> = {
  "core-access": LayoutGrid,
  "ready-templates": FileText,
  "visible-progress": TrendingUp,
};

/** Grid split + base scroll-reveal stagger step (seconds). */
export const CTA_LAYOUT = {
  gridColsClassName: "lg:grid-cols-[1fr_0.65fr]",
  revealDelayStepSeconds: 0.1,
};
