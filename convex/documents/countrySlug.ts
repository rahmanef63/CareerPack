/**
 * URL slug helpers for the PUBLIC country document guides
 * (`/dokumen` + `/dokumen/[slug]`).
 *
 * The public URL is derived from `countryLabel` (the Indonesian name), NOT
 * from the ISO code — "/dokumen/korea-selatan" reads and ranks far better
 * than "/dokumen/kr", and it is what a visitor would actually type.
 *
 * The slug -> ISO-code map is DERIVED from `_seeds/documents` rather than
 * hand-written, so a country can never be present in one place and missing
 * in the other. `countrySlug.test.ts` pins the nine slugs the public routes
 * ship with, so a seed rename that would silently 404 a live, indexed URL
 * turns into a red test instead.
 *
 * Callers that need to resolve a row for a slug NOT covered by a seed (an
 * admin-authored custom template) fall back to matching
 * `countryLabelToSlug(row.countryLabel)` — see `getPublicCountryGuide`.
 */
import { DOCUMENT_SEED_BY_COUNTRY } from "../_seeds/documents";

/**
 * "Korea Selatan" -> "korea-selatan", "Uni Emirat Arab" -> "uni-emirat-arab".
 *
 * NFD + combining-mark strip folds accents down to ASCII ("Perú" -> "peru")
 * so a future country with a diacritic does not land on a percent-encoded
 * URL. Any remaining non-alphanumeric run collapses to a single "-", and
 * leading/trailing separators are trimmed.
 *
 * Idempotent: feeding a slug back in returns the same slug, which is what
 * lets `countryCodeForSlug` normalise dirty input from the router.
 */
export function countryLabelToSlug(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Public slug -> ISO-3166-1 alpha-2 code, derived from the seed catalog.
 *
 * Null prototype on purpose: this map is keyed by a path segment straight
 * off the router, so an ordinary object literal would answer
 * `map["constructor"]` with an inherited function and hand a truthy
 * non-country back to the caller.
 */
export const COUNTRY_SLUG_TO_CODE: Readonly<Record<string, string>> =
  Object.freeze(
    DOCUMENT_SEED_BY_COUNTRY.reduce<Record<string, string>>((acc, seed) => {
      acc[countryLabelToSlug(seed.countryLabel)] = seed.country;
      return acc;
    }, Object.create(null) as Record<string, string>),
  );

/**
 * Resolve a URL slug to the `documentTemplates.country` value so the caller
 * can use the `by_country` index instead of scanning. Returns null for
 * anything unknown — the caller decides between a fallback scan and a 404.
 */
export function countryCodeForSlug(slug: string): string | null {
  if (typeof slug !== "string" || slug.length === 0) return null;
  return COUNTRY_SLUG_TO_CODE[countryLabelToSlug(slug)] ?? null;
}
