import type { SkillDraft, SkillShape } from "../types/roadmap";

export function blankSkill(): SkillDraft {
  return {
    id: crypto.randomUUID(),
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
