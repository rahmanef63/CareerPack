import type { useQuery } from "convex/react";
import type { api } from "../../../../../../convex/_generated/api";

export type RoadmapRow = NonNullable<
  ReturnType<typeof useQuery<typeof api.admin.queries.listAllRoadmaps>>
>[number];

export type SkillShape = RoadmapRow["skills"][number];

export type ResourceDraft = {
  type: string;
  title: string;
  url: string;
  completed: boolean;
};

export type SkillDraft = {
  id: string;
  name: string;
  category: string;
  level: string;
  status: string;
  priority: number | "";
  estimatedHours: number | "";
  prerequisites: string;
  resources: ResourceDraft[];
};
