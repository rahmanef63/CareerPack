/**
 * Roadmap templates — domain "education".
 *
 * Edit individual JSON files directly. This index lists the order
 * they appear in the seed catalog. Add a new skill by creating
 * <slug>.json then adding the import + array entry below.
 */
import type { RoadmapTemplateData } from "../types";

import teacher_k12 from "./teacher-k12.json";
import lecturer from "./lecturer.json";
import corporate_trainer from "./corporate-trainer.json";
import online_educator from "./online-educator.json";
import curriculum_developer from "./curriculum-developer.json";

export const educationTemplates: ReadonlyArray<RoadmapTemplateData> = [
  teacher_k12 as RoadmapTemplateData,
  lecturer as RoadmapTemplateData,
  corporate_trainer as RoadmapTemplateData,
  online_educator as RoadmapTemplateData,
  curriculum_developer as RoadmapTemplateData,
];
