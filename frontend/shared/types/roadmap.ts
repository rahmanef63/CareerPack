/**
 * Cross-slice roadmap types — shared by the admin template editor
 * (admin-panel) and the user-facing roadmap renderer (skill-roadmap).
 *
 * The shape mirrors what `convex/roadmap/schema.ts#templateNodeValidator`
 * accepts on write, so this is the canonical "loaded" view. Slice-local
 * form-draft variants (with `"" | number` for in-progress numeric inputs)
 * are derived via `Omit` in the slice's own types/ folder.
 */

import type { ResourceType } from "./common";

export interface TemplateNodeResource {
    id: string;
    title: string;
    type: string;
    url: string;
    free: boolean;
}

export interface TemplateNode {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    estimatedHours: number;
    prerequisites: string[];
    parentId?: string;
    category?: string;
    tags?: string[];
    resources: TemplateNodeResource[];
}

/**
 * Allowed `type` values for a roadmap resource. Single source of truth —
 * the dropdown options in the admin editor read from this list, and the
 * Convex sanitizer in `_shared/sanitize.ts` also gates against it.
 */
export const ROADMAP_RESOURCE_TYPES: readonly ResourceType[] = [
    "course", "book", "article", "video", "practice", "documentation", "other",
] as const;
