export interface SeedDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  required: boolean;
  issuingAuthority?: string;
  validityYears?: number;
  notes?: string;
}

/** One citation backing a country's document list — shown to the user so
 *  "info ini didapat dari mana" has a real answer instead of just trusting
 *  the app. Always an official/primary source (embassy, ministry, agency),
 *  never a blog or aggregator. */
export interface SeedSource {
  label: string;
  url: string;
}

export interface SeedCountryDocs {
  country: string;
  countryLabel: string;
  flag?: string;
  description?: string;
  documents: SeedDocument[];
  /** Official sources this list was checked against. */
  sources?: SeedSource[];
  /** ISO date (YYYY-MM-DD) this content was last checked against `sources`.
   *  Immigration rules (salary thresholds, agency names, portal URLs)
   *  change often — this is what lets a user judge how stale the list is. */
  lastVerified?: string;
}
