/**
 * Roadmap templates — domain "government".
 *
 * Edit individual JSON files directly. This index lists the order
 * they appear in the seed catalog. Add a new skill by creating
 * <slug>.json then adding the import + array entry below.
 */
import type { RoadmapTemplateData } from "../types";

import asn from "./asn.json";
import public_procurement from "./public-procurement.json";

export const governmentTemplates: ReadonlyArray<RoadmapTemplateData> = [
  asn as RoadmapTemplateData,
  public_procurement as RoadmapTemplateData,
];
