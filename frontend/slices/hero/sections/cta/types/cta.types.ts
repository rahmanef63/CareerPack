import type { LucideIcon } from "lucide-react";

/**
 * Data shapes for the landing "Cta" section (replaces the old
 * FinalCtaSection). Right column renders a short list of real
 * product-capability statements — never fabricated metrics. See HONESTY
 * RULE in the section brief.
 */

/** One benefit row inside the right-column benefits card. Bold title +
 * a single honest, factual description line — no invented numbers. */
export interface CtaBenefit {
  id: string;
  title: string;
  description: string;
}

/** A benefit merged with its icon (config) for rendering. */
export interface CtaBenefitWithIcon extends CtaBenefit {
  icon: LucideIcon;
}
