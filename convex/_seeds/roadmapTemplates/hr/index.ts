/**
 * Roadmap templates — domain "hr".
 *
 * Edit individual JSON files directly. This index lists the order
 * they appear in the seed catalog. Add a new skill by creating
 * <slug>.json then adding the import + array entry below.
 */
import type { RoadmapTemplateData } from "../types";

import hr_generalist from "./hr-generalist.json";
import recruiter from "./recruiter.json";
import payroll_admin from "./payroll-admin.json";

export const hrTemplates: ReadonlyArray<RoadmapTemplateData> = [
  hr_generalist as RoadmapTemplateData,
  recruiter as RoadmapTemplateData,
  payroll_admin as RoadmapTemplateData,
];
