import { describe, it, expect } from "vitest";
import {
  COUNTRY_SLUG_TO_CODE,
  countryCodeForSlug,
  countryLabelToSlug,
} from "./countrySlug";
import { DOCUMENT_SEED_BY_COUNTRY } from "../_seeds/documents";

/**
 * These slugs are LIVE, INDEXED URLs. Once Google has crawled
 * /dokumen/korea-selatan, renaming the seed's `countryLabel` silently turns
 * that URL into a 404 — the exact failure a unit test is cheap insurance
 * against. Every expectation below is the published contract, not an
 * implementation detail.
 */
describe("countryLabelToSlug — published /dokumen slugs", () => {
  it.each([
    ["Indonesia", "indonesia"],
    ["Jepang", "jepang"],
    ["Korea Selatan", "korea-selatan"],
    ["Singapura", "singapura"],
    ["Australia", "australia"],
    ["Jerman", "jerman"],
    ["Belanda", "belanda"],
    ["Uni Emirat Arab", "uni-emirat-arab"],
    ["Arab Saudi", "arab-saudi"],
  ])("%s -> %s", (label, slug) => {
    expect(countryLabelToSlug(label)).toBe(slug);
  });
});

describe("countryLabelToSlug — normalisation", () => {
  it("strips accents down to ASCII", () => {
    expect(countryLabelToSlug("Perú")).toBe("peru");
    expect(countryLabelToSlug("Côte d'Ivoire")).toBe("cote-d-ivoire");
  });

  it("collapses separator runs and trims the edges", () => {
    expect(countryLabelToSlug("  Korea   Selatan  ")).toBe("korea-selatan");
    expect(countryLabelToSlug("Timor-Leste")).toBe("timor-leste");
  });

  it("is idempotent — a slug fed back in is unchanged", () => {
    for (const seed of DOCUMENT_SEED_BY_COUNTRY) {
      const slug = countryLabelToSlug(seed.countryLabel);
      expect(countryLabelToSlug(slug)).toBe(slug);
    }
  });

  it("returns an empty string when nothing survives", () => {
    expect(countryLabelToSlug("")).toBe("");
    expect(countryLabelToSlug("///")).toBe("");
  });
});

describe("COUNTRY_SLUG_TO_CODE", () => {
  it("covers every seeded country exactly once", () => {
    expect(Object.keys(COUNTRY_SLUG_TO_CODE)).toHaveLength(
      DOCUMENT_SEED_BY_COUNTRY.length,
    );
  });

  it("maps each seed label to its own ISO code", () => {
    for (const seed of DOCUMENT_SEED_BY_COUNTRY) {
      expect(COUNTRY_SLUG_TO_CODE[countryLabelToSlug(seed.countryLabel)]).toBe(
        seed.country,
      );
    }
  });
});

describe("countryCodeForSlug", () => {
  it("resolves the published slugs", () => {
    expect(countryCodeForSlug("korea-selatan")).toBe("KR");
    expect(countryCodeForSlug("uni-emirat-arab")).toBe("AE");
    expect(countryCodeForSlug("indonesia")).toBe("ID");
  });

  it("normalises dirty router input rather than 404-ing on it", () => {
    expect(countryCodeForSlug("Korea-Selatan")).toBe("KR");
    expect(countryCodeForSlug("korea--selatan")).toBe("KR");
  });

  it("returns null for unknown or empty input", () => {
    expect(countryCodeForSlug("wakanda")).toBeNull();
    expect(countryCodeForSlug("")).toBeNull();
    // Prototype keys must not leak through the lookup.
    expect(countryCodeForSlug("constructor")).toBeNull();
    expect(countryCodeForSlug("__proto__")).toBeNull();
  });
});
