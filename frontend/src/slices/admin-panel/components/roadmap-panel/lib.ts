import type { SkillDraft, SkillShape } from "./types";

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function blankSkill(): SkillDraft {
  return {
    id: genId(),
    name: "",
    category: "",
    level: "beginner",
    status: "not-started",
    priority: 0,
    estimatedHours: 0,
    prerequisites: "",
    resources: [],
  };
}

export function skillToForm(skill: SkillShape): SkillDraft {
  return {
    id: skill.id,
    name: skill.name,
    category: skill.category,
    level: skill.level,
    status: skill.status,
    priority: skill.priority,
    estimatedHours: skill.estimatedHours,
    prerequisites: skill.prerequisites.join(", "),
    resources: skill.resources.map((r) => ({ ...r })),
  };
}
