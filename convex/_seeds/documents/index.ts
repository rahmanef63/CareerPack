import { ID_DOCS } from "./id";
import { JP_DOCS } from "./jp";
import { KR_DOCS } from "./kr";
import { DE_DOCS } from "./de";
import { NL_DOCS } from "./nl";
import { SG_DOCS } from "./sg";
import { AE_DOCS } from "./ae";
import { AU_DOCS } from "./au";
import { SA_DOCS } from "./sa";
import { MY_DOCS } from "./my";
import { TW_DOCS } from "./tw";
import { HK_DOCS } from "./hk";
import { QA_DOCS } from "./qa";
import { US_DOCS } from "./us";
import { GB_DOCS } from "./gb";

export type { SeedDocument, SeedCountryDocs } from "./types";

/**
 * Canonical country order — drives the picker UI sort. ID first
 * (home base), then APAC migration destinations popular with ID
 * jobseekers (JP/KR/SG/AU/MY/TW/HK), then Europe (DE/NL/GB), then
 * Middle East (AE/SA/QA — major remittance corridors), then North
 * America (US — skilled-professional destination).
 */
export const DOCUMENT_SEED_BY_COUNTRY = [
  ID_DOCS,
  JP_DOCS,
  KR_DOCS,
  SG_DOCS,
  AU_DOCS,
  MY_DOCS,
  TW_DOCS,
  HK_DOCS,
  DE_DOCS,
  NL_DOCS,
  GB_DOCS,
  AE_DOCS,
  SA_DOCS,
  QA_DOCS,
  US_DOCS,
] as const;
