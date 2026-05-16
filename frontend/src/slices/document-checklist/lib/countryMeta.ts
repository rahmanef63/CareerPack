/**
 * Derived metadata per ISO-3166-1 alpha-2 country code. Kept in the
 * consumer slice (not the backend) so the picker can filter on
 * continent / work-language without an extra round-trip.
 *
 * `domestic` flag separates Indonesia (the home country) from the
 * overseas destinations — the overseas tab hides ID entirely; the
 * domestic tab does not need a country picker at all.
 *
 * Add a new country: register its template via `_seeds/documents`,
 * then add an entry here. The picker auto-includes any country that
 * has BOTH a server-side template AND a meta entry; unknown countries
 * fall back to continent "lain" so they remain selectable.
 */

export type Continent = "asia" | "oceania" | "europe" | "middle-east" | "other";

export const CONTINENT_LABEL: Record<Continent, string> = {
  asia: "Asia",
  oceania: "Oseania",
  europe: "Eropa",
  "middle-east": "Timur Tengah",
  other: "Lain",
};

interface CountryMeta {
  continent: Continent;
  /** Bahasa yang dominan dipakai di tempat kerja / aplikasi visa. */
  workLanguages: ReadonlyArray<string>;
  /** True for the home country — excluded from the overseas picker. */
  domestic?: true;
}

export const COUNTRY_META: Record<string, CountryMeta> = {
  ID: { continent: "asia", workLanguages: ["Indonesia"], domestic: true },
  JP: { continent: "asia", workLanguages: ["Jepang", "Inggris"] },
  KR: { continent: "asia", workLanguages: ["Korea", "Inggris"] },
  SG: { continent: "asia", workLanguages: ["Inggris"] },
  AU: { continent: "oceania", workLanguages: ["Inggris"] },
  DE: { continent: "europe", workLanguages: ["Jerman", "Inggris"] },
  NL: { continent: "europe", workLanguages: ["Belanda", "Inggris"] },
  AE: { continent: "middle-east", workLanguages: ["Inggris", "Arab"] },
  SA: { continent: "middle-east", workLanguages: ["Arab", "Inggris"] },
};

export function getCountryMeta(code: string): CountryMeta {
  return COUNTRY_META[code] ?? { continent: "other", workLanguages: [] };
}

export function isDomestic(code: string): boolean {
  return Boolean(COUNTRY_META[code]?.domestic);
}
