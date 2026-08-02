import { mutation, internalMutation, type MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { requireUser } from "../_shared/auth";
import { enforceRateLimit } from "../_shared/rateLimit";
import { MCP_WRITE_LIMIT, MCP_WRITE_DAILY_LIMIT } from "../mcp/data/limits";
import { MAX_URL_LEN } from "../_shared/url";
import type { Id } from "../_generated/dataModel";

const MAX_PATH_LEN = 100;
const MAX_ID_LEN = 100;
const MAX_NAME_LEN = 200;
const MAX_CATEGORY_LEN = 60;
const MAX_TITLE_LEN = 200;
const MAX_SKILLS = 100;
const MAX_RESOURCES = 20;
const MAX_HOURS = 10_000;
const MAX_PRIORITY = 999;

const LEVEL_WHITELIST = new Set(["beginner", "intermediate", "advanced"]);
const STATUS_WHITELIST = new Set(["not-started", "in-progress", "completed"]);
const RESOURCE_TYPE_WHITELIST = new Set([
  "course",
  "book",
  "article",
  "video",
  "practice",
  "documentation",
  "other",
]);

function trimLen(field: string, value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) {
    throw new Error(`${field} 1-${max} karakter`);
  }
  return trimmed;
}

function assertFiniteNonNeg(field: string, n: number, max: number): number {
  if (!Number.isFinite(n) || n < 0 || n > max) {
    throw new Error(`${field} harus 0-${max}`);
  }
  return n;
}

export const seedRoadmap = mutation({
  args: {
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
      resources: v.array(v.object({
        type: v.string(),
        title: v.string(),
        url: v.string(),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const careerPath = trimLen("Career path", args.careerPath, MAX_PATH_LEN);

    if (args.skills.length === 0 || args.skills.length > MAX_SKILLS) {
      throw new Error(`Skills 1-${MAX_SKILLS}`);
    }

    const sanitized = args.skills.map((skill) => {
      if (!LEVEL_WHITELIST.has(skill.level)) {
        throw new Error("Level tidak valid");
      }
      if (skill.resources.length > MAX_RESOURCES) {
        throw new Error(`Resources ≤${MAX_RESOURCES}`);
      }

      return {
        id: trimLen("Skill ID", skill.id, MAX_ID_LEN),
        name: trimLen("Skill name", skill.name, MAX_NAME_LEN),
        category: trimLen("Kategori", skill.category, MAX_CATEGORY_LEN),
        level: skill.level,
        priority: assertFiniteNonNeg("Priority", skill.priority, MAX_PRIORITY),
        estimatedHours: assertFiniteNonNeg("Hours", skill.estimatedHours, MAX_HOURS),
        prerequisites: skill.prerequisites.map((p) =>
          trimLen("Prerequisite ID", p, MAX_ID_LEN),
        ),
        status: "not-started",
        resources: skill.resources.map((r) => {
          if (!RESOURCE_TYPE_WHITELIST.has(r.type)) {
            throw new Error("Tipe resource tidak valid");
          }
          return {
            type: r.type,
            title: trimLen("Resource title", r.title, MAX_TITLE_LEN),
            url: trimLen("URL", r.url, MAX_URL_LEN),
            completed: false,
          };
        }),
      };
    });

    // Auto-bookmark the slug into roadmapSaved so the "Skill Saya" tab
    // grid shows it. Single source of truth: any seeded roadmap is by
    // definition picked. Unsaving is a separate explicit action.
    const savedDoc = await ctx.db
      .query("roadmapSaved")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!savedDoc) {
      await ctx.db.insert("roadmapSaved", { userId, slugs: [careerPath] });
    } else if (!savedDoc.slugs.includes(careerPath)) {
      await ctx.db.patch(savedDoc._id, {
        slugs: [...savedDoc.slugs, careerPath],
      });
    }

    const existing = await ctx.db
      .query("skillRoadmaps")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing && existing.careerPath === careerPath) {
      const prior = new Map(existing.skills.map((s) => [s.id, s]));
      const merged = sanitized.map((skill) => {
        const old = prior.get(skill.id);
        if (!old) return skill;
        return {
          ...skill,
          status: old.status,
          completedAt: old.completedAt,
          resources: skill.resources.map((r) => {
            const oldResource = old.resources.find((or) => or.title === r.title);
            return oldResource ? { ...r, completed: oldResource.completed } : r;
          }),
        };
      });
      const done = merged.filter((s) => s.status === "completed").length;
      const progress = merged.length === 0 ? 0 : Math.round((done / merged.length) * 100);
      await ctx.db.patch(existing._id, {
        skills: merged,
        progress,
        ...(args.templateId !== undefined ? { templateId: args.templateId } : {}),
      });
      return existing._id;
    }

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return await ctx.db.insert("skillRoadmaps", {
      userId,
      careerPath,
      templateId: args.templateId,
      skills: sanitized,
      progress: 0,
    });
  },
});

/** Shared by the UI mutation and the MCP one at the bottom of this file —
 *  the two differ only in how identity was established. */
async function applySkillStatus(
  ctx: MutationCtx,
  userId: Id<"users">,
  args: { skillId: string; status: string },
) {
  const skillId = trimLen("Skill ID", args.skillId, MAX_ID_LEN);

  if (!STATUS_WHITELIST.has(args.status)) {
    throw new Error("Status tidak valid");
  }

  const roadmap = await ctx.db
    .query("skillRoadmaps")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (!roadmap) throw new Error("Roadmap tidak ditemukan");

  let touched = false;
  const updatedSkills = roadmap.skills.map((skill) => {
    if (skill.id === skillId) {
      touched = true;
      return {
        ...skill,
        status: args.status,
        completedAt:
          args.status === "completed" ? Date.now() : skill.completedAt,
      };
    }
    return skill;
  });

  if (!touched) throw new Error("Skill tidak ditemukan");

  const completedSkills = updatedSkills.filter((s) => s.status === "completed").length;
  const progress =
    updatedSkills.length === 0
      ? 0
      : Math.round((completedSkills / updatedSkills.length) * 100);

  await ctx.db.patch(roadmap._id, {
    skills: updatedSkills,
    progress,
  });
  return { skill_id: skillId, status: args.status, progress };
}

export const updateSkillProgress = mutation({
  args: {
    skillId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await applySkillStatus(ctx, userId, args);
  },
});

async function applyToggleResource(
  ctx: MutationCtx,
  userId: Id<"users">,
  args: { skillId: string; resourceTitle: string; completed: boolean },
) {
  const skillId = trimLen("Skill ID", args.skillId, MAX_ID_LEN);
  const resourceTitle = trimLen(
    "Resource title",
    args.resourceTitle,
    MAX_TITLE_LEN,
  );

  const roadmap = await ctx.db
    .query("skillRoadmaps")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  if (!roadmap) throw new Error("Roadmap tidak ditemukan");

  // Track whether the target skill + resource actually exist so a bad
  // skillId / resourceTitle throws instead of silently patching an
  // unchanged array. Mirrors `updateSkillProgress`. NOTE: resource
  // titles are not unique within a skill, so a double-toggle on two
  // same-titled resources still flips both — fixing that needs a stable
  // resource id in the schema and is out of scope here.
  let skillFound = false;
  let resourceFound = false;
  const updatedSkills = roadmap.skills.map((skill) => {
    if (skill.id !== skillId) return skill;
    skillFound = true;
    return {
      ...skill,
      resources: skill.resources.map((r) => {
        if (r.title !== resourceTitle) return r;
        resourceFound = true;
        return { ...r, completed: args.completed };
      }),
    };
  });

  if (!skillFound) throw new Error("Skill tidak ditemukan");
  if (!resourceFound) throw new Error("Resource tidak ditemukan");

  await ctx.db.patch(roadmap._id, { skills: updatedSkills });
  return {
    skill_id: skillId,
    resource_title: resourceTitle,
    completed: args.completed,
  };
}

export const toggleResource = mutation({
  args: {
    skillId: v.string(),
    resourceTitle: v.string(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await applyToggleResource(ctx, userId, args);
  },
});

async function applyReset(ctx: MutationCtx, userId: Id<"users">) {
  const existing = await ctx.db
    .query("skillRoadmaps")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  if (existing) await ctx.db.delete(existing._id);
  return { deleted: existing !== null };
}

export const resetRoadmap = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    await applyReset(ctx, userId);
  },
});

/**
 * Seed the user's active roadmap from a public template slug.
 *
 * Server-side equivalent of the client effect in `useSkillRoadmap`
 * (slice's auto-seed flow), enabling AI agent + scripted callers to
 * start a roadmap with one round-trip. Does NOT call seedRoadmap —
 * that has a different validator shape and is meant for the client
 * effect that already flattens nodes via `buildTreeFromNodes`. Here
 * the template's flat node array maps directly onto the skills shape.
 */
async function applyStartFromTemplate(
  ctx: MutationCtx,
  userId: Id<"users">,
  rawSlug: string,
) {
  const slug = trimLen("Slug", rawSlug, MAX_PATH_LEN).toLowerCase();

  const tpl = await ctx.db
    .query("roadmapTemplates")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .first();
  if (!tpl || !tpl.isPublic) {
    throw new Error("Template tidak ditemukan");
  }

  const skills = tpl.nodes.map((n, idx) => {
    if (!LEVEL_WHITELIST.has(n.difficulty)) {
      throw new Error(`Difficulty node "${n.id}" tidak valid`);
    }
    return {
      id: trimLen("Skill ID", n.id, MAX_ID_LEN),
      name: trimLen("Skill name", n.title, MAX_NAME_LEN),
      category: slug,
      level: n.difficulty,
      priority: idx,
      estimatedHours: assertFiniteNonNeg("Hours", n.estimatedHours, MAX_HOURS),
      prerequisites: n.prerequisites.map((p) =>
        trimLen("Prerequisite ID", p, MAX_ID_LEN),
      ),
      status: "not-started",
      resources: n.resources.slice(0, MAX_RESOURCES).map((r) => {
        if (!RESOURCE_TYPE_WHITELIST.has(r.type)) {
          throw new Error("Tipe resource tidak valid");
        }
        return {
          type: r.type,
          title: trimLen("Resource title", r.title, MAX_TITLE_LEN),
          url: trimLen("URL", r.url || "#", MAX_URL_LEN),
          completed: false,
        };
      }),
    };
  });

  const savedDoc = await ctx.db
    .query("roadmapSaved")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  if (!savedDoc) {
    await ctx.db.insert("roadmapSaved", { userId, slugs: [slug] });
  } else if (!savedDoc.slugs.includes(slug)) {
    await ctx.db.patch(savedDoc._id, { slugs: [...savedDoc.slugs, slug] });
  }

  const existing = await ctx.db
    .query("skillRoadmaps")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  if (existing) await ctx.db.delete(existing._id);

  const roadmapId = await ctx.db.insert("skillRoadmaps", {
    userId,
    careerPath: slug,
    templateId: tpl._id,
    skills,
    progress: 0,
  });
  return { roadmapId, slug, title: tpl.title, skillCount: skills.length };
}

export const startFromTemplate = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const { roadmapId } = await applyStartFromTemplate(ctx, userId, args.slug);
    return roadmapId;
  },
});

// ---------------------------------------------------------------------------
// MCP (convex/mcp/tools/roadmap.ts). `requireUser` throws in an MCP request —
// no @convex-dev/auth session — so the user id arrives as an explicit arg
// resolved from the bearer token and scopes the `by_user` lookups above.
// ---------------------------------------------------------------------------

/** An MCP token outlives any browser tab and drives writes unattended. */
async function mcpQuota(ctx: MutationCtx, userId: Id<"users">) {
  await enforceRateLimit(ctx, userId, MCP_WRITE_LIMIT);
  await enforceRateLimit(ctx, userId, MCP_WRITE_DAILY_LIMIT);
}

export const mcpStartFromTemplate = internalMutation({
  args: { userId: v.id("users"), slug: v.string() },
  handler: async (ctx, args) => {
    await mcpQuota(ctx, args.userId);
    const { slug, title, skillCount } = await applyStartFromTemplate(
      ctx,
      args.userId,
      args.slug,
    );
    return { slug, title, skill_count: skillCount };
  },
});

export const mcpSetSkillStatus = internalMutation({
  args: { userId: v.id("users"), skillId: v.string(), status: v.string() },
  handler: async (ctx, args) => {
    await mcpQuota(ctx, args.userId);
    return await applySkillStatus(ctx, args.userId, args);
  },
});

export const mcpToggleResource = internalMutation({
  args: {
    userId: v.id("users"),
    skillId: v.string(),
    resourceTitle: v.string(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await mcpQuota(ctx, args.userId);
    return await applyToggleResource(ctx, args.userId, args);
  },
});

export const mcpReset = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await mcpQuota(ctx, args.userId);
    return await applyReset(ctx, args.userId);
  },
});
