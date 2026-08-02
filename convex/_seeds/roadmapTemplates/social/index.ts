/**
 * Roadmap templates — domain "social".
 *
 * Edit individual JSON files directly. This index lists the order
 * they appear in the seed catalog. Add a new skill by creating
 * <slug>.json then adding the import + array entry below.
 */
import type { RoadmapTemplateData } from "../types";

import social_worker from "./social-worker.json";
import ngo_manager from "./ngo-manager.json";
import renewable_energy_esg from "./renewable-energy-esg.json";

export const socialTemplates: ReadonlyArray<RoadmapTemplateData> = [
  social_worker as RoadmapTemplateData,
  ngo_manager as RoadmapTemplateData,
  renewable_energy_esg as RoadmapTemplateData,
];
