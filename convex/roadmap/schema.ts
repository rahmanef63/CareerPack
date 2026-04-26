import { defineTable } from "convex/server";
import { v } from "convex/values";

export const roadmapTables = {
  skillRoadmaps: defineTable({
    userId: v.id("users"),
    careerPath: v.string(),
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
};
