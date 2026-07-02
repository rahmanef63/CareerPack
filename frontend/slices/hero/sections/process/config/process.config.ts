/**
 * Presentation config — kept separate from constants/ (content copy).
 * Everything here is layout/color numbers, never Indonesian copy.
 */

/** Distinct theme-token dot background per step, keyed by ProcessStep.id. */
export const STEP_DOT_COLOR_CLASSNAME: Record<number, string> = {
  1: "bg-primary",
  2: "bg-warning",
  3: "bg-info",
  4: "bg-success",
};

/** Fallback color when a step id has no explicit mapping above. */
export const STEP_DOT_COLOR_FALLBACK = "bg-primary";

/** Base scroll-reveal stagger step, in seconds, applied per rendered item. */
export const REVEAL_DELAY_STEP_SECONDS = 0.1;
