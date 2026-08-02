/**
 * Default seed catalog for roadmap templates.
 *
 * The catalog is split per skill (one JSON file each, grouped by
 * domain) so individual skills can be edited or replaced without
 * touching the others. Per-domain index.ts files export an ordered
 * list; this root concatenates them in the canonical domain order.
 *
 * To add a new skill:
 *   1. Create `<domain>/<slug>.json` (copy an existing one as a template).
 *   2. Add the import + array entry to `<domain>/index.ts`.
 * To add a new domain:
 *   1. mkdir <domain>/, create at least one <slug>.json + index.ts.
 *   2. Add the import + spread to this file.
 */
export type {
  RoadmapTemplateData,
  RoadmapTemplateNode,
  RoadmapTemplateResource,
  RoadmapTemplateManifest,
  RoadmapTemplateConfig,
} from "./types";
import type { RoadmapTemplateData } from "./types";

import { techTemplates } from "./tech";
import { businessTemplates } from "./business";
import { creativeTemplates } from "./creative";
import { educationTemplates } from "./education";
import { healthTemplates } from "./health";
import { financeTemplates } from "./finance";
import { hrTemplates } from "./hr";
import { governmentTemplates } from "./government";
import { socialTemplates } from "./social";

export const defaultRoadmapTemplates: ReadonlyArray<RoadmapTemplateData> = [
  ...techTemplates,
  ...businessTemplates,
  ...creativeTemplates,
  ...educationTemplates,
  ...healthTemplates,
  ...financeTemplates,
  ...hrTemplates,
  ...governmentTemplates,
  ...socialTemplates,
];
