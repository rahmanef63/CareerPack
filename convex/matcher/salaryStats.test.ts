import { describe, it, expect } from "vitest";
import { percentile, pickDominantCurrency, summarizeSalaries } from "./salaryStats";

describe("percentile", () => {
  it("returns null for an empty sample", () => {
    expect(percentile([], 0.5)).toBeNull();
  });

  it("p75 of [a,b] returns the upper value, not the lower (no floor bias)", () => {
    expect(percentile([100, 200], 0.75)).toBe(200);
  });

  it("p50 picks the middle of an odd-length sample", () => {
    expect(percentile([10, 20, 30], 0.5)).toBe(20);
  });

  it("p25 / p75 over a known 5-sample distribution", () => {
    const s = [10, 20, 30, 40, 50];
    expect(percentile(s, 0.25)).toBe(20); // round(4 * 0.25) = 1
    expect(percentile(s, 0.75)).toBe(40); // round(4 * 0.75) = 3
  });
});

describe("pickDominantCurrency", () => {
  it("returns the most frequent currency", () => {
    expect(pickDominantCurrency(new Map([["IDR", 3], ["USD", 1]]))).toBe("IDR");
  });

  it("defaults to USD on an empty map", () => {
    expect(pickDominantCurrency(new Map())).toBe("USD");
  });
});

describe("summarizeSalaries — currency separation", () => {
  it("computes percentiles from the dominant currency only, never a mix", () => {
    const rows = [
      { category: "eng", currency: "IDR", salaryMin: 20_000_000, salaryMax: 20_000_000, workMode: "onsite" },
      { category: "eng", currency: "IDR", salaryMin: 30_000_000, salaryMax: 30_000_000, workMode: "remote" },
      { category: "eng", currency: "IDR", salaryMin: 40_000_000, salaryMax: 40_000_000, workMode: "onsite" },
      // A single USD outlier must NOT contaminate the IDR percentiles.
      { category: "eng", currency: "USD", salaryMin: 120_000, salaryMax: 120_000, workMode: "remote" },
    ];
    const [insight] = summarizeSalaries(rows);
    expect(insight.currency).toBe("IDR");
    expect(insight.p50).toBe(30_000_000); // IDR median, not skewed by 120k USD
    expect(insight.withSalaryCount).toBe(3); // dominant-currency sample only
    expect(insight.count).toBe(4); // total listings in the category
    expect(insight.remotePct).toBe(50); // 2 of 4 remote
  });

  it("counts rows without salary data but excludes them from percentiles", () => {
    const rows = [
      { category: "x", currency: "IDR" },
      { category: "x", currency: "IDR", salaryMin: 10_000_000, salaryMax: 10_000_000 },
    ];
    const [i] = summarizeSalaries(rows);
    expect(i.count).toBe(2);
    expect(i.withSalaryCount).toBe(1);
    expect(i.p50).toBe(10_000_000);
  });

  it("sorts categories by listing count, descending", () => {
    const rows = [
      { category: "small", currency: "USD", salaryMin: 100, salaryMax: 100 },
      { category: "big", currency: "USD", salaryMin: 100, salaryMax: 100 },
      { category: "big", currency: "USD", salaryMin: 200, salaryMax: 200 },
    ];
    const out = summarizeSalaries(rows);
    expect(out[0].category).toBe("big");
  });
});
