import { ID_DOCS } from "./id";
import { JP_DOCS } from "./jp";
import { KR_DOCS } from "./kr";
import { DE_DOCS } from "./de";
import { NL_DOCS } from "./nl";
import { SG_DOCS } from "./sg";
import { AE_DOCS } from "./ae";
import { AU_DOCS } from "./au";
import { SA_DOCS } from "./sa";

export type { SeedDocument, SeedCountryDocs } from "./types";

/**
 * Canonical country order — drives the picker UI sort. ID first
 * (home base), then APAC migration destinations popular with ID
 * jobseekers (JP/KR/SG/AU), then Europe (DE/NL), then Middle East
 * (AE/SA — major remittance corridors).
 */
export const DOCUMENT_SEED_BY_COUNTRY = [
  ID_DOCS,
  JP_DOCS,
  KR_DOCS,
  SG_DOCS,
  AU_DOCS,
  DE_DOCS,
  NL_DOCS,
  AE_DOCS,
  SA_DOCS,
] as const;
