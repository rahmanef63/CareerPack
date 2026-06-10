import { describe, it, expect } from "vitest";
import { formatShortIDR } from "./formatCurrency";

describe("formatShortIDR", () => {
  it("formats rb / jt / m units", () => {
    expect(formatShortIDR(5_000)).toBe("Rp 5,0 rb");
    expect(formatShortIDR(1_500_000)).toBe("Rp 1,5 jt");
    expect(formatShortIDR(2_000_000_000)).toBe("Rp 2,0 m");
  });

  it("promotes a value that would round up to the next unit", () => {
    // 999_999 must read "1,0 jt", not the old "1000,0 rb" artifact.
    expect(formatShortIDR(999_999)).toBe("Rp 1,0 jt");
  });

  it("keeps the sign for negative values", () => {
    expect(formatShortIDR(-1_500_000)).toBe("-Rp 1,5 jt");
  });

  it("returns the em-dash for null / undefined / non-finite", () => {
    expect(formatShortIDR(null)).toBe("—");
    expect(formatShortIDR(undefined)).toBe("—");
    expect(formatShortIDR(Number.NaN)).toBe("—");
  });

  it("falls back to full IDR below 1 rb", () => {
    const out = formatShortIDR(500);
    expect(out).toContain("500");
    expect(out).not.toContain("rb");
  });
});
