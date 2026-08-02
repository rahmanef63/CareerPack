/** Skill validation + progress recompute for admin roadmap CRUD. */

import { v } from "convex/values";

export const skillInputValidator = v.object({
  id: v.string(),
  name: v.string(),
  category: v.string(),
  level: v.string(),
  priority: v.number(),
  estimatedHours: v.number(),
  prerequisites: v.array(v.string()),
  status: v.string(),
  resources: v.array(v.object({
    type: v.string(),
    title: v.string(),
    url: v.string(),
    completed: v.boolean(),
  })),
});

const LEVEL_WL = new Set(["beginner", "intermediate", "advanced"]);
const STATUS_WL = new Set(["not-started", "in-progress", "completed"]);
const RES_TYPE_WL = new Set([
  "course", "book", "article", "video", "practice", "documentation", "other",
]);

export function recalcProgress(skills: Array<{ status: string }>): number {
  if (!skills.length) return 0;
  const done = skills.filter((s) => s.status === "completed").length;
  return Math.round((done / skills.length) * 100);
}

export interface AdminSkillInput {
  id: string;
  name: string;
  category: string;
  level: string;
  priority: number;
  estimatedHours: number;
  prerequisites: string[];
  status: string;
  resources: Array<{
    type: string;
    title: string;
    url: string;
    completed: boolean;
  }>;
}

/** Merge a normalized skill into the existing skill array, preserving
 * `completedAt` semantics when status is "completed". */
export function mergeSkill<S extends { id: string; status: string; completedAt?: number }>(
  skills: S[],
  normalized: S,
  now: number,
): S[] {
  const existing = skills.find((s) => s.id === normalized.id);
  if (existing) {
    return skills.map((s) => {
      if (s.id !== normalized.id) return s;
      return {
        ...normalized,
        completedAt:
          normalized.status === "completed" ? (s.completedAt ?? now) : undefined,
      };
    });
  }
  return [
    ...skills,
    {
      ...normalized,
      completedAt: normalized.status === "completed" ? now : undefined,
    },
  ];
}

/** Validate + normalize. Throws Indonesian errors. */
export function normalizeSkillInput(skill: AdminSkillInput) {
  const name = skill.name.trim();
  if (!name || name.length > 200) throw new Error("Nama skill 1-200 karakter");
  const category = skill.category.trim();
  if (!category || category.length > 60) throw new Error("Kategori 1-60 karakter");
  if (!LEVEL_WL.has(skill.level)) throw new Error("Level tidak valid");
  if (!STATUS_WL.has(skill.status)) throw new Error("Status tidak valid");
  if (!Number.isFinite(skill.estimatedHours) || skill.estimatedHours < 0) {
    throw new Error("Estimasi jam harus >= 0");
  }
  if (skill.resources.length > 20) throw new Error("Resources maksimal 20");
  for (const r of skill.resources) {
    if (!RES_TYPE_WL.has(r.type)) throw new Error("Tipe resource tidak valid");
  }
  return { ...skill, name, category };
}
