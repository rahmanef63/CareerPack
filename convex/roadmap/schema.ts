import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Shared validator for a single template node — exported so admin and
 * publish mutations can reuse the same shape (one source of truth).
 */
export const templateNodeValidator = v.object({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  difficulty: v.string(),
  estimatedHours: v.number(),
  prerequisites: v.array(v.string()),
  parentId: v.optional(v.string()),
  category: v.optional(v.string()),
  resources: v.array(v.object({
    id: v.string(),
    title: v.string(),
    type: v.string(),
    url: v.string(),
    free: v.boolean(),
  })),
});

/**
 * Domain whitelist — keep aligned with TemplatePanel + SkillRoadmap UI.
 * Frozen Set so callers can `.has()` cheaply without reallocating.
 */
export const VALID_DOMAINS: ReadonlySet<string> = new Set([
  "tech", "business", "creative", "education", "health",
  "finance", "hr", "operations", "government", "social", "hospitality",
]);

export const roadmapTables = {
  skillRoadmaps: defineTable({
    userId: v.id("users"),
    careerPath: v.string(),
    templateId: v.optional(v.id("roadmapTemplates")),
    skills: v.array(v.object({
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
      completedAt: v.optional(v.number()),
    })),
    progress: v.number(),
  }).index("by_user", ["userId"]),

  roadmapTemplates: defineTable({
    title: v.string(),
    slug: v.string(),
    domain: v.string(),
    icon: v.string(),
    color: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
    nodes: v.array(templateNodeValidator),
    isPublic: v.boolean(),
    isSystem: v.boolean(),
    order: v.number(),
    authorId: v.optional(v.id("users")),
    authorName: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_domain", ["domain"])
    .index("by_order", ["order"])
    .index("by_author", ["authorId"]),
};
