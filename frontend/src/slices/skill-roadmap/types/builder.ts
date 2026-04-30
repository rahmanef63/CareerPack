import type { RoadmapResource as Resource } from "./index";

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

export type TemplateNode = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedHours: number;
  prerequisites: string[];
  parentId?: string;
  category?: string;
  tags?: string[];
  resources: Array<{ id: string; title: string; type: string; url: string; free: boolean }>;
};
