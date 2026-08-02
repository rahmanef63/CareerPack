export interface RoadmapTemplateResource {
  id: string;
  title: string;
  type: string;
  url: string;
  free: boolean;
}

export interface RoadmapTemplateNode {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedHours: number;
  prerequisites: string[];
  parentId?: string;
  category?: string;
  resources: RoadmapTemplateResource[];
}

export interface RoadmapTemplateManifest {
  version?: string;
  license?: string;
  language?: string;
  outcomes?: string[];
  prerequisites?: string[];
  targetAudience?: string;
}

export interface RoadmapTemplateConfig {
  xpPerHour?: number;
  theme?: string;
  questFlavor?: string;
}

export interface RoadmapTemplateData {
  title: string;
  slug: string;
  domain: string;
  icon: string;
  color: string;
  description: string;
  tags: string[];
  order: number;
  isPublic: boolean;
  isSystem: boolean;
  nodes: RoadmapTemplateNode[];
  manifest?: RoadmapTemplateManifest;
  config?: RoadmapTemplateConfig;
}
