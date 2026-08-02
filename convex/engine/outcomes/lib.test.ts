import { describe, expect, it } from "vitest";
import {
  bayesianPosterior,
  bucketSuccessRate,
  bucketTotal,
  emptyBucket,
  DEFAULT_PRIOR_N,
  DEFAULT_PRIOR_P,
} from "./lib";

describe("bayesianPosterior", () => {
  it("returns prior when no observed data", () => {
    const r = bayesianPosterior(0.3, 10, 0, 0);
    expect(r.posteriorP).toBeCloseTo(0.3, 6);
    expect(r.posteriorN).toBe(10);
  });

  it("pulls posterior toward observed when sample is large", () => {
    // Prior 10%, weak strength (5 pseudo-obs); observed 80/100 success.
    const r = bayesianPosterior(0.1, 5, 80, 100);
    expect(r.posteriorP).toBeGreaterThan(0.7);
    expect(r.posteriorN).toBe(105);
  });

  it("stays anchored to prior when prior strength is huge", () => {
    // 1000 pseudo-obs at 50% prior, only 3/5 observed — barely budges.
    const r = bayesianPosterior(0.5, 1000, 3, 5);
    expect(r.posteriorP).toBeGreaterThan(0.49);
    expect(r.posteriorP).toBeLessThan(0.51);
  });

  it("clamps prior probability into [0, 1]", () => {
    const r = bayesianPosterior(1.5, 10, 0, 0);
    expect(r.posteriorP).toBe(1);
    const r2 = bayesianPosterior(-0.2, 10, 0, 0);
    expect(r2.posteriorP).toBe(0);
  });

  it("handles zero prior strength with uniform prior fall-through", () => {
    // priorN=0 + no data — falls back to clamp01(prior).
    const r = bayesianPosterior(0.4, 0, 0, 0);
    expect(r.posteriorP).toBe(0.4);
    expect(r.posteriorN).toBe(0);
  });

  it("clamps successes to total to ignore corrupt input", () => {
    const r = bayesianPosterior(0.1, 5, 999, 10);
    // successes clamped to 10
    expect(r.posteriorP).toBeGreaterThan(0.6);
    expect(r.posteriorP).toBeLessThanOrEqual(1);
  });

  it("default prior matches uniform constants", () => {
    const r = bayesianPosterior(DEFAULT_PRIOR_P, DEFAULT_PRIOR_N, 0, 0);
    expect(r.posteriorP).toBe(DEFAULT_PRIOR_P);
  });
});

describe("EventCountBucket helpers", () => {
  it("emptyBucket sums to zero", () => {
    expect(bucketTotal(emptyBucket())).toBe(0);
  });

  it("bucketSuccessRate uses applies as denom when ≥ acc+rej", () => {
    const b = emptyBucket();
    b.applies = 10;
    b.accepted = 2;
    b.rejected = 3;
    const r = bucketSuccessRate(b);
    expect(r.successes).toBe(2);
    expect(r.total).toBe(10);
  });

  it("bucketSuccessRate falls back to acc+rej when applies underreported", () => {
    const b = emptyBucket();
    b.applies = 2;
    b.accepted = 4;
    b.rejected = 1;
    const r = bucketSuccessRate(b);
    expect(r.total).toBe(5);
  });
});
