/**
 * Outcome Calibrator — pure math. No Convex imports so it can be
 * unit-tested without a backend.
 */

/**
 * Conjugate Beta-Binomial update of a success rate. The prior is
 * expressed as (priorP, priorN) where priorN is the effective
 * pseudo-sample-size — bigger priorN = stronger anchor to the seed
 * estimate. Observed = (successes, total). Returns posterior mean
 * + posterior pseudo-sample-size.
 *
 * Equivalent to Beta(α = priorP·priorN, β = (1-priorP)·priorN)
 * conjugate-updated by Binomial(successes/total), with the posterior
 * mean = (α + successes) / (α + β + total).
 */
export function bayesianPosterior(
  priorP: number,
  priorN: number,
  successes: number,
  total: number,
): { posteriorP: number; posteriorN: number } {
  const safePrior = Math.max(priorN, 0);
  const safeTotal = Math.max(total, 0);
  const safeSucc = Math.max(0, Math.min(successes, safeTotal));
  const alpha = clamp01(priorP) * safePrior;
  const beta = (1 - clamp01(priorP)) * safePrior;
  const num = alpha + safeSucc;
  const den = alpha + beta + safeTotal;
  const posteriorP = den === 0 ? clamp01(priorP) : num / den;
  return {
    posteriorP: clamp01(posteriorP),
    posteriorN: safePrior + safeTotal,
  };
}

/** Minimum group size before we publish a posterior — privacy floor. */
export const MIN_COHORT_K = 5;

/** Calibration look-back window in milliseconds (180 days). */
export const CALIB_WINDOW_MS = 180 * 24 * 60 * 60 * 1000;

/**
 * Hard cap on events the calibrator pulls per run. Combined with a
 * desc range-scan over the `by_time` index this yields the most-recent
 * N *in-window* events deterministically — never an arbitrary slice.
 */
export const CALIB_MAX_EVENTS = 10_000;

/** Default uniform prior when no curated seed edge exists. */
export const DEFAULT_PRIOR_P = 0.1;
export const DEFAULT_PRIOR_N = 10;

export interface EventCountBucket {
  applies: number;
  callbacks: number;
  interviews: number;
  offers: number;
  accepted: number;
  rejected: number;
}

export function emptyBucket(): EventCountBucket {
  return {
    applies: 0,
    callbacks: 0,
    interviews: 0,
    offers: 0,
    accepted: 0,
    rejected: 0,
  };
}

export function bucketTotal(b: EventCountBucket): number {
  return b.applies + b.accepted + b.rejected;
}

/** Successes = accepted; failures = rejected; total = applies. */
export function bucketSuccessRate(b: EventCountBucket): {
  successes: number;
  total: number;
} {
  return {
    successes: b.accepted,
    total: Math.max(b.applies, b.accepted + b.rejected),
  };
}

function clamp01(p: number): number {
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(1, p));
}
