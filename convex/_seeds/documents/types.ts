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

export interface SeedCountryDocs {
  country: string;
  countryLabel: string;
  flag?: string;
  description?: string;
  documents: SeedDocument[];
}
