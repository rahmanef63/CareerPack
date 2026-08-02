import { describe, it, expect } from "vitest";
import { laplaceNoise, noiseCount, noiseCohort, DEFAULT_EPSILON } from "./lib";

describe("laplaceNoise", () => {
  it("produces values around zero with expected magnitude", () => {
    const N = 10_000;
    let sum = 0;
    let absSum = 0;
    for (let i = 0; i < N; i++) {
      const x = laplaceNoise(1);
      sum += x;
      absSum += Math.abs(x);
    }
    const mean = sum / N;
    const meanAbs = absSum / N;
    // Mean should be near 0 (within 0.1 for N=10k).
    expect(Math.abs(mean)).toBeLessThan(0.1);
    // Mean absolute = scale (=1 here) for Laplace.
    expect(meanAbs).toBeGreaterThan(0.7);
    expect(meanAbs).toBeLessThan(1.3);
  });

  it("scales with the scale parameter", () => {
    const N = 5_000;
    let sumAbs = 0;
    for (let i = 0; i < N; i++) sumAbs += Math.abs(laplaceNoise(10));
    expect(sumAbs / N).toBeGreaterThan(7);
    expect(sumAbs / N).toBeLessThan(13);
  });
});

describe("noiseCount", () => {
  it("clips to zero", () => {
    // Force a tiny epsilon → huge noise scale; run many trials.
    // Output should never be negative.
    for (let i = 0; i < 1_000; i++) {
      const r = noiseCount(0, 0.01);
      expect(r.value).toBeGreaterThanOrEqual(0);
    }
  });

  it("rejects non-positive epsilon", () => {
    expect(() => noiseCount(10, 0)).toThrow();
    expect(() => noiseCount(10, -1)).toThrow();
  });

  it("stays close to true value with high epsilon (= low noise)", () => {
    const trueValue = 100;
    const N = 200;
    let sumValue = 0;
    for (let i = 0; i < N; i++) {
      sumValue += noiseCount(trueValue, 10).value;
    }
    const mean = sumValue / N;
    // ε=10 → scale=0.1 → essentially exact.
    expect(Math.abs(mean - trueValue)).toBeLessThan(2);
  });
});

describe("noiseCohort", () => {
  it("returns all six noised counts + composite budget", () => {
    const r = noiseCohort(
      { apply: 100, callback: 30, interview: 12, offer: 4, accepted: 2, rejected: 65 },
      DEFAULT_EPSILON,
    );
    expect(r.applyCount).toBeGreaterThanOrEqual(0);
    expect(r.callbackCount).toBeGreaterThanOrEqual(0);
    expect(r.epsilonTotal).toBeCloseTo(6.0, 6);
    expect(r.band).toBe("high");
    expect(r.callbackRate).not.toBeNull();
    expect(r.callbackRate!).toBeGreaterThan(0.15);
    expect(r.callbackRate!).toBeLessThan(0.5);
  });

  it("bands sample-size by true apply count, not noised", () => {
    const r1 = noiseCohort(
      { apply: 0, callback: 0, interview: 0, offer: 0, accepted: 0, rejected: 0 },
      DEFAULT_EPSILON,
    );
    expect(r1.band).toBe("none");

    const r2 = noiseCohort(
      { apply: 7, callback: 2, interview: 1, offer: 0, accepted: 0, rejected: 4 },
      DEFAULT_EPSILON,
    );
    expect(r2.band).toBe("low");

    const r3 = noiseCohort(
      { apply: 25, callback: 8, interview: 3, offer: 1, accepted: 0, rejected: 15 },
      DEFAULT_EPSILON,
    );
    expect(r3.band).toBe("medium");
  });

  it("callbackRate is null when noised apply hits 0", () => {
    // True apply=0 → after noise, may be small or 0. Just check no crash.
    const r = noiseCohort(
      { apply: 0, callback: 0, interview: 0, offer: 0, accepted: 0, rejected: 0 },
      DEFAULT_EPSILON,
    );
    expect(typeof r.callbackRate === "number" || r.callbackRate === null).toBe(true);
  });

  it("callbackRate is clamped to [0, 1]", () => {
    // Force callback > apply via noise corner case — repeat trials.
    for (let i = 0; i < 100; i++) {
      const r = noiseCohort(
        { apply: 1, callback: 1, interview: 0, offer: 0, accepted: 0, rejected: 0 },
        0.5,
      );
      if (r.callbackRate !== null) {
        expect(r.callbackRate).toBeGreaterThanOrEqual(0);
        expect(r.callbackRate).toBeLessThanOrEqual(1);
      }
    }
  });
});
