/**
 * Presentation config — kept separate from constants/ (content copy).
 * Everything here is layout/color numbers, never Indonesian copy.
 */

/** Distinct landing-* dot background per step, keyed by ProcessStep.id. */
export const STEP_DOT_COLOR_CLASSNAME: Record<number, string> = {
  1: "bg-landing-blue",
  2: "bg-landing-terra",
  3: "bg-landing-violet",
  4: "bg-landing-green",
};

/** Fallback color when a step id has no explicit mapping above. */
export const STEP_DOT_COLOR_FALLBACK = "bg-landing-blue";

/** Base scroll-reveal stagger step, in seconds, applied per rendered item. */
export const REVEAL_DELAY_STEP_SECONDS = 0.1;
