import { describe, it, expect } from "vitest";
import { validateRewrite } from "./validator";

describe("validateRewrite", () => {
  it("accepts a faithful paraphrase", () => {
    const r = validateRewrite(
      "Membangun fitur autentikasi di React dengan TypeScript",
      "Mengembangkan modul autentikasi React menggunakan TypeScript",
    );
    expect(r.ok).toBe(true);
    expect(r.violations).toEqual([]);
  });

  it("preserves numeric tokens — accepts when all numbers carried through", () => {
    const r = validateRewrite(
      "Mengurangi response time API dari 800ms ke 120ms (-85%)",
      "Memangkas latensi API dari 800ms ke 120ms, turun -85%",
    );
    expect(r.ok).toBe(true);
  });

  it("rejects when a number is dropped", () => {
    const r = validateRewrite(
      "Memproses 1000 transaksi per detik",
      "Memproses banyak transaksi per detik",
    );
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.includes("hilang"))).toBe(true);
  });

  it("rejects when a hallucinated number appears", () => {
    const r = validateRewrite(
      "Membangun pipeline data",
      "Membangun pipeline data yang memproses 500K events/detik",
    );
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.includes("dikarang"))).toBe(true);
  });

  it("rejects an unrelated rewrite (low Jaccard)", () => {
    const r = validateRewrite(
      "Memimpin tim backend untuk migrasi monolith ke microservices",
      "Mendesain UI komponen library dengan Storybook",
    );
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.includes("Tumpang-tindih"))).toBe(true);
  });

  it("ignores Indonesian + English stopwords when computing overlap", () => {
    const r = validateRewrite(
      "Membangun sistem rekomendasi dengan TensorFlow di Python",
      "Mengembangkan sistem rekomendasi memakai TensorFlow dengan Python",
    );
    expect(r.ok).toBe(true);
  });

  it("handles percent + currency tokens consistently", () => {
    const r = validateRewrite(
      "Meningkatkan konversi sebesar 18% dan revenue $1.2M setahun",
      "Mengangkat konversi 18% serta menambah revenue $1.2M per tahun",
    );
    expect(r.ok).toBe(true);
  });
});
