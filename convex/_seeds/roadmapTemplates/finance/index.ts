/**
 * Roadmap templates — domain "finance".
 *
 * Edit individual JSON files directly. This index lists the order
 * they appear in the seed catalog. Add a new skill by creating
 * <slug>.json then adding the import + array entry below.
 */
import type { RoadmapTemplateData } from "../types";

import accounting from "./accounting.json";
import financial_planner from "./financial-planner.json";
import tax_consultant from "./tax-consultant.json";
import investment_analyst from "./investment-analyst.json";
import fintech_engineer from "./fintech-engineer.json";

export const financeTemplates: ReadonlyArray<RoadmapTemplateData> = [
  accounting as RoadmapTemplateData,
  financial_planner as RoadmapTemplateData,
  tax_consultant as RoadmapTemplateData,
  investment_analyst as RoadmapTemplateData,
  fintech_engineer as RoadmapTemplateData,
];
