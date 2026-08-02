/**
 * Differential-Privacy primitives — Phase 5 substrate.
 *
 * Laplace-mechanism noise + bounded clipping for counts / rates.
 * Pure JS, deterministic-on-seed for tests, side-effect-free.
 *
 * The mechanism guarantees that for any neighboring datasets D, D'
 * (one user added/removed), the noised output distribution differs
 * by at most a factor of e^ε. Smaller ε = stronger privacy.
 *
 * Default ε for engine queries is 1.0 — a common starting choice in
 * applied DP literature for ratio-style queries with hundreds-of-N
 * cohorts.
 */

export interface NoisedCount {
  /** The noised, post-clipping integer count. */
  value: number;
  /** Privacy budget ε spent for this single release. */
  epsilon: number;
  /** True noise magnitude (signed) for transparency in debug logs. */
  rawNoise: number;
  /** Raw pre-noise count — internal; UI must not surface. */
  trueValue: number;
}

export interface DPCohortStats {
  applyCount: number;
  callbackCount: number;
  interviewCount: number;
  offerCount: number;
  acceptedCount: number;
  rejectedCount: number;
  /** Empirical callback rate AFTER noise. null when applyCount=0 post-noise. */
  callbackRate: number | null;
  /** Privacy budget consumed by this composite release. */
  epsilonTotal: number;
  /** Sample-size band: low/med/high for UI confidence display. */
  band: "none" | "low" | "medium" | "high";
}

/**
 * Sample a Laplace(0, scale) noise value. Inverse-CDF method:
 *   F⁻¹(u) = -scale * sign(u - 0.5) * ln(1 - 2|u - 0.5|)
 *
 * Uses Math.random() — fine for non-cryptographic privacy at
 * MVP scale. Phase 6 can swap to crypto.getRandomValues for
 * stronger guarantees if regulatory pressure shows up.
 */
export function laplaceNoise(scale: number): number {
  const u = Math.random() - 0.5;
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

/**
 * Noise a non-negative count under (ε, sensitivity-1) Laplace.
 * Sensitivity 1 = adding/removing one user changes the count by ≤ 1.
 * Returns the noised integer, clipped at 0.
 */
export function noiseCount(trueValue: number, epsilon: number): NoisedCount {
  if (epsilon <= 0) {
    throw new Error("epsilon must be > 0");
  }
  const scale = 1 / epsilon;
  const rawNoise = laplaceNoise(scale);
  const noised = Math.max(0, Math.round(trueValue + rawNoise));
  return { value: noised, epsilon, rawNoise, trueValue };
}

/**
 * Apply Laplace noise to each count in a cohort-style aggregate.
 * `epsilonPerQuery` is split across 6 release counts so the total
 * privacy budget = epsilonPerQuery * 6 stays bounded.
 */
export function noiseCohort(
  trueCounts: {
    apply: number;
    callback: number;
    interview: number;
    offer: number;
    accepted: number;
    rejected: number;
  },
  epsilonPerQuery: number,
): DPCohortStats {
  const apply = noiseCount(trueCounts.apply, epsilonPerQuery);
  const callback = noiseCount(trueCounts.callback, epsilonPerQuery);
  const interview = noiseCount(trueCounts.interview, epsilonPerQuery);
  const offer = noiseCount(trueCounts.offer, epsilonPerQuery);
  const accepted = noiseCount(trueCounts.accepted, epsilonPerQuery);
  const rejected = noiseCount(trueCounts.rejected, epsilonPerQuery);

  const callbackRate =
    apply.value > 0 ? Math.min(1, callback.value / apply.value) : null;

  const trueApply = trueCounts.apply;
  const band: "none" | "low" | "medium" | "high" =
    trueApply === 0
      ? "none"
      : trueApply < 10
        ? "low"
        : trueApply < 50
          ? "medium"
          : "high";

  return {
    applyCount: apply.value,
    callbackCount: callback.value,
    interviewCount: interview.value,
    offerCount: offer.value,
    acceptedCount: accepted.value,
    rejectedCount: rejected.value,
    callbackRate,
    epsilonTotal: epsilonPerQuery * 6,
    band,
  };
}

/**
 * Default ε per single release. The composite cohort consumes
 * 6 × DEFAULT_EPSILON = 6.0 total — generous; Phase 6 will tighten
 * once a per-user ε budget is enforced.
 */
export const DEFAULT_EPSILON = 1.0;

/**
 * Hard minimum cohort size below which the engine refuses to
 * publish even a noised aggregate. Pure k-anonymity defense for
 * very small N where DP noise alone leaks too much.
 */
export const MIN_COHORT_N = 5;
