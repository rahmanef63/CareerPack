/**
 * Roadmap templates — domain "health".
 *
 * Edit individual JSON files directly. This index lists the order
 * they appear in the seed catalog. Add a new skill by creating
 * <slug>.json then adding the import + array entry below.
 */
import type { RoadmapTemplateData } from "../types";

import nurse from "./nurse.json";
import pharmacist from "./pharmacist.json";
import health_admin from "./health-admin.json";
import nutritionist from "./nutritionist.json";

export const healthTemplates: ReadonlyArray<RoadmapTemplateData> = [
  nurse as RoadmapTemplateData,
  pharmacist as RoadmapTemplateData,
  health_admin as RoadmapTemplateData,
  nutritionist as RoadmapTemplateData,
];
