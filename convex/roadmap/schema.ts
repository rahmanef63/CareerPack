import { defineTable } from "convex/server";
import { v } from "convex/values";

const templateNodeValidator = v.object({
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
  })
    .index("by_slug", ["slug"])
    .index("by_domain", ["domain"])
    .index("by_order", ["order"]),
};
