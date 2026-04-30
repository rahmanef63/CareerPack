import { mutation, type MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../_shared/auth";
import type { Id } from "../_generated/dataModel";
import { defaultRoadmapTemplates } from "../_seeds/roadmapTemplates";
import { templateNodeValidator, VALID_DOMAINS } from "../roadmap/schema";

/**
 * Cascade-delete every record owned by `userId`, then the user record
 * itself + auth artefacts. See docs/auth.md for the full delete contract.
 *
 * `roleAuditLogs` and `feedback` are intentionally NOT cascaded — both
 * survive user deletion so historical context stays reviewable.
 */
export async function cascadeDeleteUser(ctx: MutationCtx, userId: Id<"users">) {
  const owned = [
    "userProfiles",
    "jobApplications",
    "cvs",
    "skillRoadmaps",
    "documentChecklists",
    "mockInterviews",
    "financialPlans",
    "careerGoals",
    "notifications",
    "chatConversations",
    "calendarEvents",
    "portfolioItems",
    "contacts",
    "budgetVariables",
    "aiSettings",
    "atsScans",
    "quickFillBatches",
  ] as const;

  for (const table of owned) {
    const rows = await ctx.db
      .query(table)
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const r of rows) await ctx.db.delete(r._id);
  }

  const userFiles = await ctx.db
    .query("files")
    .withIndex("by_user", (q) => q.eq("uploadedBy", userId))
    .collect();
  for (const f of userFiles) {
    try {
      await ctx.storage.delete(f.storageId);
    } catch {
      /* blob may already be gone */
    }
    await ctx.db.delete(f._id);
  }

  const authSessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .collect();
  for (const s of authSessions) {
    const refreshTokens = await ctx.db
      .query("authRefreshTokens")
      .withIndex("sessionId", (q) => q.eq("sessionId", s._id))
      .collect();
    for (const r of refreshTokens) await ctx.db.delete(r._id);
    await ctx.db.delete(s._id);
  }

  const authAccounts = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
    .collect();
  for (const a of authAccounts) {
    const codes = await ctx.db
      .query("authVerificationCodes")
      .withIndex("accountId", (q) => q.eq("accountId", a._id))
      .collect();
    for (const c of codes) await ctx.db.delete(c._id);
    await ctx.db.delete(a._id);
  }

  const resets = await ctx.db
    .query("passwordResetTokens")
    .filter((q) => q.eq(q.field("userId"), userId))
    .collect();
  for (const t of resets) await ctx.db.delete(t._id);

  await ctx.db.delete(userId);
}

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("moderator"),
      v.literal("user"),
    ),
  },
  handler: async (ctx, args) => {
    const callerId = await requireAdmin(ctx);

    if (callerId === args.userId && args.role !== "admin") {
      const adminProfiles = await ctx.db
        .query("userProfiles")
        .withIndex("by_role", (q) => q.eq("role", "admin"))
        .collect();
      const otherAdmins = adminProfiles.filter(
        (p) => p.userId !== callerId,
      );
      if (otherAdmins.length === 0) {
        throw new Error(
          "Tidak bisa menurunkan peran Anda sendiri: Anda satu-satunya admin. Tetapkan admin lain dulu.",
        );
      }
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("Pengguna tidak ditemukan");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const previousRole = (profile?.role ?? "user") as "admin" | "moderator" | "user";

    if (profile) {
      await ctx.db.patch(profile._id, { role: args.role });
    } else {
      const targetName =
        (targetUser as { name?: string; email?: string }).name ??
        (targetUser as { email?: string }).email ??
        "Pengguna";

      await ctx.db.insert("userProfiles", {
        userId: args.userId,
        fullName: targetName,
        location: "",
        targetRole: "",
        experienceLevel: "",
        role: args.role,
      });
    }

    if (previousRole !== args.role) {
      await ctx.db.insert("roleAuditLogs", {
        actorUserId: callerId,
        targetUserId: args.userId,
        previousRole,
        newRole: args.role,
        timestamp: Date.now(),
      });
    }
  },
});

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const callerId = await requireAdmin(ctx);
    if (callerId === args.userId) {
      const adminProfiles = await ctx.db
        .query("userProfiles")
        .withIndex("by_role", (q) => q.eq("role", "admin"))
        .collect();
      const otherAdmins = adminProfiles.filter(
        (p) => p.userId !== callerId,
      );
      if (otherAdmins.length === 0) {
        throw new Error(
          "Tidak bisa menghapus akun Anda sendiri: Anda satu-satunya admin.",
        );
      }
    }
    await cascadeDeleteUser(ctx, args.userId);
    return { ok: true as const };
  },
});

export const bulkDeleteUsers = mutation({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const callerId = await requireAdmin(ctx);
    const ids = args.userIds.slice(0, 100);
    if (ids.includes(callerId)) {
      const adminProfiles = await ctx.db
        .query("userProfiles")
        .withIndex("by_role", (q) => q.eq("role", "admin"))
        .collect();
      const otherAdmins = adminProfiles.filter(
        (p) => p.userId !== callerId,
      );
      if (otherAdmins.length === 0) {
        throw new Error(
          "Pilihan termasuk akun Anda dan Anda satu-satunya admin. Hapus diri sendiri tidak diizinkan.",
        );
      }
    }
    let deleted = 0;
    for (const id of ids) {
      await cascadeDeleteUser(ctx, id);
      deleted++;
    }
    return { ok: true as const, deleted };
  },
});

// ---- Roadmap admin CRUD ----

const LEVEL_WL = new Set(["beginner", "intermediate", "advanced"]);
const STATUS_WL = new Set(["not-started", "in-progress", "completed"]);
const RES_TYPE_WL = new Set([
  "course", "book", "article", "video", "practice", "documentation", "other",
]);

function recalcProgress(skills: Array<{ status: string }>): number {
  if (!skills.length) return 0;
  const done = skills.filter((s) => s.status === "completed").length;
  return Math.round((done / skills.length) * 100);
}

export const adminDeleteRoadmap = mutation({
  args: { roadmapId: v.id("skillRoadmaps") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) throw new Error("Roadmap tidak ditemukan");
    await ctx.db.delete(args.roadmapId);
  },
});

export const adminUpdateCareerPath = mutation({
  args: { roadmapId: v.id("skillRoadmaps"), careerPath: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const cp = args.careerPath.trim();
    if (!cp || cp.length > 100) throw new Error("Career path 1-100 karakter");
    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) throw new Error("Roadmap tidak ditemukan");
    await ctx.db.patch(args.roadmapId, { careerPath: cp });
  },
});

export const adminUpsertSkill = mutation({
  args: {
    roadmapId: v.id("skillRoadmaps"),
    skill: v.object({
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
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { skill } = args;

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

    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) throw new Error("Roadmap tidak ditemukan");

    const now = Date.now();
    const normalized = { ...skill, name, category };
    const existing = roadmap.skills.find((s) => s.id === skill.id);

    let updatedSkills;
    if (existing) {
      updatedSkills = roadmap.skills.map((s) => {
        if (s.id !== skill.id) return s;
        return {
          ...normalized,
          completedAt:
            skill.status === "completed"
              ? (s.completedAt ?? now)
              : undefined,
        };
      });
    } else {
      updatedSkills = [
        ...roadmap.skills,
        {
          ...normalized,
          completedAt: skill.status === "completed" ? now : undefined,
        },
      ];
    }

    await ctx.db.patch(args.roadmapId, {
      skills: updatedSkills,
      progress: recalcProgress(updatedSkills),
    });
  },
});

export const adminRemoveSkill = mutation({
  args: { roadmapId: v.id("skillRoadmaps"), skillId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) throw new Error("Roadmap tidak ditemukan");
    const updated = roadmap.skills.filter((s) => s.id !== args.skillId);
    await ctx.db.patch(args.roadmapId, {
      skills: updated,
      progress: recalcProgress(updated),
    });
  },
});

// ---- Roadmap Template admin CRUD ----
// Validator + domain whitelist live in roadmap/schema.ts so the publish
// mutation can reuse exactly the same shape (one source of truth).

export const adminUpsertTemplate = mutation({
  args: {
    id: v.optional(v.id("roadmapTemplates")),
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
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const slug = args.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (!slug || slug.length > 80) throw new Error("Slug 1-80 karakter huruf kecil/angka/tanda hubung");
    const title = args.title.trim();
    if (!title || title.length > 120) throw new Error("Judul 1-120 karakter");
    if (!VALID_DOMAINS.has(args.domain)) throw new Error("Domain tidak valid");
    if (args.nodes.length > 200) throw new Error("Maksimal 200 node per template");

    const payload = {
      title,
      slug,
      domain: args.domain,
      icon: args.icon.trim() || "BookOpen",
      color: args.color.trim() || "bg-brand",
      description: args.description.trim(),
      tags: args.tags.map((t) => t.trim()).filter(Boolean).slice(0, 20),
      nodes: args.nodes,
      isPublic: args.isPublic,
      isSystem: args.isSystem,
      order: args.order,
    };

    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing) throw new Error("Template tidak ditemukan");
      await ctx.db.patch(args.id, payload);
      return args.id;
    }

    // Check slug uniqueness
    const dup = await ctx.db
      .query("roadmapTemplates")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (dup) throw new Error(`Slug "${slug}" sudah dipakai`);

    return ctx.db.insert("roadmapTemplates", payload);
  },
});

export const adminDeleteTemplate = mutation({
  args: { id: v.id("roadmapTemplates") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const tpl = await ctx.db.get(args.id);
    if (!tpl) throw new Error("Template tidak ditemukan");
    if (tpl.isSystem) throw new Error("Template sistem tidak bisa dihapus");
    await ctx.db.delete(args.id);
  },
});

export const adminToggleTemplatePublic = mutation({
  args: { id: v.id("roadmapTemplates"), isPublic: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const tpl = await ctx.db.get(args.id);
    if (!tpl) throw new Error("Template tidak ditemukan");
    await ctx.db.patch(args.id, { isPublic: args.isPublic });
  },
});

export const adminSeedDefaultTemplates = mutation({
  args: { overwrite: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let inserted = 0;
    let skipped = 0;

    for (const tpl of defaultRoadmapTemplates) {
      const existing = await ctx.db
        .query("roadmapTemplates")
        .withIndex("by_slug", (q) => q.eq("slug", tpl.slug))
        .first();

      if (existing) {
        if (args.overwrite) {
          await ctx.db.patch(existing._id, { ...tpl, isSystem: true });
          inserted++;
        } else {
          skipped++;
        }
        continue;
      }

      await ctx.db.insert("roadmapTemplates", { ...tpl, isSystem: true });
      inserted++;
    }

    return { inserted, skipped };
  },
});
