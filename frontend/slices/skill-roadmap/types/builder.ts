import type { RoadmapResource as Resource } from "./index";

/**
 * Tree-renderable roadmap node — what the user-facing renderer walks
 * recursively (`children` is the resolved subtree). Distinct from the
 * canonical `TemplateNode` shape (flat with `parentId`) which lives in
 * `@/shared/types/roadmap` and is shared with the admin editor.
 */
export interface SimpleRoadmapNode {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  prerequisites: string[];
  resources: Resource[];
  children?: SimpleRoadmapNode[];
}

export type { TemplateNode } from "@/shared/types";
