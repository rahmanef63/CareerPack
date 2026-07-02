import { CTA_BENEFITS } from "../constants/cta.constants";
import { CTA_BENEFIT_ICONS, CTA_LAYOUT } from "../config/cta.config";
import type { CtaBenefitWithIcon } from "../types/cta.types";

export interface UseCtaContentResult {
  benefits: CtaBenefitWithIcon[];
  /** Inline style for staggered scroll-reveal, `n` = 0-based element order. */
  revealDelay: (n: number) => { animationDelay: string };
}

/**
 * Single data-access seam for the Cta section: merges the literal benefit
 * copy (constants/) with icon config (config/) into a render-ready shape,
 * plus a small stagger-delay helper for `.animate-on-scroll` elements.
 */
export function useCtaContent(): UseCtaContentResult {
  const benefits: CtaBenefitWithIcon[] = CTA_BENEFITS.map((benefit) => ({
    ...benefit,
    icon: CTA_BENEFIT_ICONS[benefit.id] ?? CTA_BENEFIT_ICONS["core-access"],
  }));

  const revealDelay = (n: number) => ({
    animationDelay: `${(n * CTA_LAYOUT.revealDelayStepSeconds).toFixed(1)}s`,
  });

  return { benefits, revealDelay };
}
