import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Shared validator for a single template node — exported so admin and
 * publish mutations can reuse the same shape (one source of truth).
 *
 * `tags` lets the UI group/search nodes by skill keyword (e.g. "react",
 * "fundamentals", "ssr") on top of the broader `category` field.
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
  tags: v.optional(v.array(v.string())),
  resources: v.array(v.object({
    id: v.string(),
    title: v.string(),
    type: v.string(),
    url: v.string(),
    free: v.boolean(),
  })),
});

/**
 * Manifest = declarative metadata about the roadmap. Mirrors the spirit
 * of a package.json or PWA manifest so external tools (export, share,
 * embed) can introspect the roadmap.
 */
export const templateManifestValidator = v.object({
  version: v.optional(v.string()),
  license: v.optional(v.string()),
  language: v.optional(v.string()),
  outcomes: v.optional(v.array(v.string())),
  prerequisites: v.optional(v.array(v.string())),
  targetAudience: v.optional(v.string()),
});

/**
 * Config = behaviour knobs (gamification theme, XP weighting, etc.).
 * All optional with sensible client-side defaults.
 */
export const templateConfigValidator = v.object({
  xpPerHour: v.optional(v.number()),
  theme: v.optional(v.string()),       // "warrior" | "scholar" | "explorer" | "artisan"
  questFlavor: v.optional(v.string()), // human prose for quest-log style
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
    manifest: v.optional(templateManifestValidator),
    config: v.optional(templateConfigValidator),
  })
    .index("by_slug", ["slug"])
    .index("by_domain", ["domain"])
    .index("by_order", ["order"])
    .index("by_author", ["authorId"]),

  /**
   * Saved/bookmarked template slugs — one row per user. Lets the
   * "Skill Saya" tab show a card grid of skills the user has picked
   * from "Cari Skills" without forcing the single-active-roadmap
   * model into a multi-doc rewrite. The active progress still lives
   * in `skillRoadmaps`; switching active is a re-seed (existing
   * behaviour). The bookmark persists.
   */
  roadmapSaved: defineTable({
    userId: v.id("users"),
    slugs: v.array(v.string()),
  }).index("by_user", ["userId"]),
};
