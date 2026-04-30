/**
 * Roadmap templates — domain "business".
 *
 * Edit individual JSON files directly. This index lists the order
 * they appear in the seed catalog. Add a new skill by creating
 * <slug>.json then adding the import + array entry below.
 */
import type { RoadmapTemplateData } from "../types";

import digital_marketing from "./digital-marketing.json";
import product_manager from "./product-manager.json";
import project_manager from "./project-manager.json";
import business_analyst from "./business-analyst.json";
import sales from "./sales.json";
import entrepreneur from "./entrepreneur.json";
import supply_chain from "./supply-chain.json";
import customer_service from "./customer-service.json";

export const businessTemplates: ReadonlyArray<RoadmapTemplateData> = [
  digital_marketing as RoadmapTemplateData,
  product_manager as RoadmapTemplateData,
  project_manager as RoadmapTemplateData,
  business_analyst as RoadmapTemplateData,
  sales as RoadmapTemplateData,
  entrepreneur as RoadmapTemplateData,
  supply_chain as RoadmapTemplateData,
  customer_service as RoadmapTemplateData,
];
