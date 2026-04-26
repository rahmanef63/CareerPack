import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser } from "../_shared/auth";

const MAX_PATH_LEN = 100;
const MAX_ID_LEN = 100;
const MAX_NAME_LEN = 200;
const MAX_CATEGORY_LEN = 60;
const MAX_URL_LEN = 500;
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
      const progress = Math.round((done / merged.length) * 100);
      await ctx.db.patch(existing._id, { skills: merged, progress });
      return existing._id;
    }

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return await ctx.db.insert("skillRoadmaps", {
      userId,
      careerPath,
      skills: sanitized,
      progress: 0,
    });
  },
});

export const updateSkillProgress = mutation({
  args: {
    skillId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
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
    const progress = Math.round((completedSkills / updatedSkills.length) * 100);

    await ctx.db.patch(roadmap._id, {
      skills: updatedSkills,
      progress,
    });
  },
});

export const toggleResource = mutation({
  args: {
    skillId: v.string(),
    resourceTitle: v.string(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
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

    const updatedSkills = roadmap.skills.map((skill) => {
      if (skill.id !== skillId) return skill;
      return {
        ...skill,
        resources: skill.resources.map((r) =>
          r.title === resourceTitle ? { ...r, completed: args.completed } : r,
        ),
      };
    });

    await ctx.db.patch(roadmap._id, { skills: updatedSkills });
  },
});

export const resetRoadmap = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("skillRoadmaps")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});
