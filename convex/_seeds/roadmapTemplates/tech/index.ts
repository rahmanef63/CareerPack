/**
 * Roadmap templates — domain "tech".
 *
 * Edit individual JSON files directly. This index lists the order
 * they appear in the seed catalog. Add a new skill by creating
 * <slug>.json then adding the import + array entry below.
 */
import type { RoadmapTemplateData } from "../types";

import ai_context_engineering from "./ai-context-engineering.json";
import frontend from "./frontend.json";
import backend from "./backend.json";
import fullstack from "./fullstack.json";
import devops from "./devops.json";
import data_science from "./data-science.json";
import mobile from "./mobile.json";
import cybersecurity from "./cybersecurity.json";
import qa_engineer from "./qa-engineer.json";
import ai_engineer from "./ai-engineer.json";

export const techTemplates: ReadonlyArray<RoadmapTemplateData> = [
  ai_context_engineering as RoadmapTemplateData,
  frontend as RoadmapTemplateData,
  backend as RoadmapTemplateData,
  fullstack as RoadmapTemplateData,
  devops as RoadmapTemplateData,
  data_science as RoadmapTemplateData,
  mobile as RoadmapTemplateData,
  cybersecurity as RoadmapTemplateData,
  qa_engineer as RoadmapTemplateData,
  ai_engineer as RoadmapTemplateData,
];
