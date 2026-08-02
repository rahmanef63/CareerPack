/**
 * Roadmap templates — domain "creative".
 *
 * Edit individual JSON files directly. This index lists the order
 * they appear in the seed catalog. Add a new skill by creating
 * <slug>.json then adding the import + array entry below.
 */
import type { RoadmapTemplateData } from "../types";

import ui_ux_design from "./ui-ux-design.json";
import graphic_design from "./graphic-design.json";
import video_editing from "./video-editing.json";
import content_writing from "./content-writing.json";
import photography from "./photography.json";
import podcaster from "./podcaster.json";

export const creativeTemplates: ReadonlyArray<RoadmapTemplateData> = [
  ui_ux_design as RoadmapTemplateData,
  graphic_design as RoadmapTemplateData,
  video_editing as RoadmapTemplateData,
  content_writing as RoadmapTemplateData,
  photography as RoadmapTemplateData,
  podcaster as RoadmapTemplateData,
];
