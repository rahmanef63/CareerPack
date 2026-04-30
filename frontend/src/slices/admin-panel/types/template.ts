import type { Id } from "../../../../../convex/_generated/dataModel";

export interface TemplateNode {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedHours: number | "";
  prerequisites: string[];
  parentId?: string;
  category?: string;
  resources: Array<{
    id: string;
    title: string;
    type: string;
    url: string;
    free: boolean;
  }>;
}

export interface ManifestDraft {
  version: string;
  license: string;
  language: string;
  outcomes: string;
  prerequisites: string;
  targetAudience: string;
}

export interface ConfigDraft {
  xpPerHour: number | "";
  theme: string;
  questFlavor: string;
}

export interface TemplateDraft {
  id?: Id<"roadmapTemplates">;
  title: string;
  slug: string;
  domain: string;
  icon: string;
  color: string;
  description: string;
  tags: string;
  nodes: TemplateNode[];
  isPublic: boolean;
  isSystem: boolean;
  order: number | "";
  manifest: ManifestDraft;
  config: ConfigDraft;
}

export const EMPTY_MANIFEST: ManifestDraft = {
  version: "", license: "", language: "id",
  outcomes: "", prerequisites: "", targetAudience: "",
};

export const EMPTY_CONFIG: ConfigDraft = {
  xpPerHour: "", theme: "", questFlavor: "",
};

export const EMPTY_DRAFT: TemplateDraft = {
  title: "", slug: "", domain: "tech", icon: "BookOpen",
  color: "bg-blue-500", description: "", tags: "",
  nodes: [], isPublic: true, isSystem: false, order: "",
  manifest: { ...EMPTY_MANIFEST },
  config: { ...EMPTY_CONFIG },
};

export const THEME_OPTIONS = [
  { value: "__none__", label: "(default)" },
  { value: "warrior", label: "Warrior — agresif, prajurit" },
  { value: "scholar", label: "Scholar — analitis, akademisi" },
  { value: "explorer", label: "Explorer — penjelajah, kreatif" },
  { value: "artisan", label: "Artisan — pengrajin, detail-oriented" },
];

export const DOMAIN_OPTIONS = [
  { value: "tech", label: "Teknologi" },
  { value: "business", label: "Bisnis" },
  { value: "creative", label: "Kreatif" },
  { value: "education", label: "Pendidikan" },
  { value: "health", label: "Kesehatan" },
  { value: "finance", label: "Keuangan" },
  { value: "hr", label: "SDM" },
  { value: "operations", label: "Operasional" },
  { value: "government", label: "Pemerintahan" },
  { value: "social", label: "Sosial" },
  { value: "hospitality", label: "Hospitality" },
];

export const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Pemula" },
  { value: "intermediate", label: "Menengah" },
  { value: "advanced", label: "Lanjutan" },
];

export const RESOURCE_TYPES = ["video", "article", "course", "book", "practice", "documentation", "other"];

export const EXPORT_FORMAT = "careerpack-roadmap-templates";
export const EXPORT_VERSION = 1;

export interface ExportTemplate {
  title: string;
  slug: string;
  domain: string;
  icon: string;
  color: string;
  description: string;
  tags: string[];
  nodes: Array<{
    id: string;
    title: string;
    description: string;
    difficulty: string;
    estimatedHours: number;
    prerequisites: string[];
    parentId?: string;
    category?: string;
    tags?: string[];
    resources: Array<{
      id: string;
      title: string;
      type: string;
      url: string;
      free: boolean;
    }>;
  }>;
  isPublic: boolean;
  isSystem: boolean;
  order: number;
  manifest?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

export interface ExportEnvelope {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  templates: ExportTemplate[];
}

export type LoadedTemplate = {
  _id: Id<"roadmapTemplates">;
  title: string;
  slug: string;
  domain: string;
  icon: string;
  color: string;
  description: string;
  tags: string[];
  nodes: ExportTemplate["nodes"];
  isPublic: boolean;
  isSystem: boolean;
  order: number;
  manifest?: ExportTemplate["manifest"];
  config?: ExportTemplate["config"];
};

export interface LinkIssue {
  templateId: string;
  templateSlug: string;
  templateTitle: string;
  nodeId: string;
  nodeTitle: string;
  resourceTitle: string;
  url: string;
  reason: string;
}

export interface AuditableTemplate {
  _id: string;
  slug: string;
  title: string;
  nodes: ReadonlyArray<{
    id: string;
    title: string;
    resources: ReadonlyArray<{ title: string; url: string }>;
  }>;
}
