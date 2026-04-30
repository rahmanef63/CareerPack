import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../_shared/auth";
import { defaultRoadmapTemplates } from "../_seeds/roadmapTemplates";
import { cascadeDeleteUser } from "./lib/cascadeDelete";
import { ensureNotLastAdmin, applyRoleChange } from "./lib/userOps";
import {
  normalizeSkillInput, recalcProgress, mergeSkill, skillInputValidator,
} from "./lib/skillOps";
import {
  validateTemplateMeta, templateInputFields,
} from "./lib/templateOps";

/** Re-exported so admin/cleanup.ts can keep its existing import. */
export { cascadeDeleteUser };

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
    if (args.role !== "admin") {
      await ensureNotLastAdmin(
        ctx, callerId, [args.userId],
        "Tidak bisa menurunkan peran Anda sendiri: Anda satu-satunya admin. Tetapkan admin lain dulu.",
      );
    }
    await applyRoleChange(ctx, callerId, args.userId, args.role);
  },
});

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const callerId = await requireAdmin(ctx);
    await ensureNotLastAdmin(
      ctx, callerId, [args.userId],
      "Tidak bisa menghapus akun Anda sendiri: Anda satu-satunya admin.",
    );
    await cascadeDeleteUser(ctx, args.userId);
    return { ok: true as const };
  },
});

export const bulkDeleteUsers = mutation({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const callerId = await requireAdmin(ctx);
    const ids = args.userIds.slice(0, 100);
    await ensureNotLastAdmin(
      ctx, callerId, ids,
      "Pilihan termasuk akun Anda dan Anda satu-satunya admin. Hapus diri sendiri tidak diizinkan.",
    );
    let deleted = 0;
    for (const id of ids) {
      await cascadeDeleteUser(ctx, id);
      deleted++;
    }
    return { ok: true as const, deleted };
  },
});

// ---- Roadmap admin CRUD ----

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
    skill: skillInputValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const normalized = normalizeSkillInput(args.skill);
    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) throw new Error("Roadmap tidak ditemukan");

    const updatedSkills = mergeSkill(roadmap.skills, normalized, Date.now());
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
    ...templateInputFields,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const meta = validateTemplateMeta(args);

    const payload = {
      ...meta,
      domain: args.domain,
      nodes: args.nodes,
      isPublic: args.isPublic,
      isSystem: args.isSystem,
      order: args.order,
      ...(args.manifest ? { manifest: args.manifest } : {}),
      ...(args.config ? { config: args.config } : {}),
    };

    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing) throw new Error("Template tidak ditemukan");
      await ctx.db.patch(args.id, payload);
      return args.id;
    }

    const dup = await ctx.db
      .query("roadmapTemplates")
      .withIndex("by_slug", (q) => q.eq("slug", meta.slug))
      .first();
    if (dup) throw new Error(`Slug "${meta.slug}" sudah dipakai`);

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

/**
 * Bulk import templates from JSON. Mirrors `adminUpsertTemplate` validation
 * but applies it per-row, collecting failures instead of aborting the whole
 * batch. Looks up by `slug` (idempotent re-runs). When `overwrite=false`,
 * existing slugs are skipped; when `overwrite=true`, full payload is patched.
 */
export const adminBulkUpsertTemplates = mutation({
  args: {
    templates: v.array(v.object(templateInputFields)),
    overwrite: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.templates.length > 200) throw new Error("Maksimal 200 template per impor");

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ slug: string; message: string }> = [];

    for (const raw of args.templates) {
      try {
        const meta = validateTemplateMeta(raw);
        const payload = {
          ...meta,
          domain: raw.domain,
          nodes: raw.nodes,
          isPublic: raw.isPublic,
          isSystem: raw.isSystem,
          order: raw.order,
          ...(raw.manifest ? { manifest: raw.manifest } : {}),
          ...(raw.config ? { config: raw.config } : {}),
        };

        const existing = await ctx.db
          .query("roadmapTemplates")
          .withIndex("by_slug", (q) => q.eq("slug", meta.slug))
          .first();

        if (existing) {
          if (args.overwrite) {
            await ctx.db.patch(existing._id, payload);
            updated++;
          } else {
            skipped++;
          }
        } else {
          await ctx.db.insert("roadmapTemplates", payload);
          inserted++;
        }
      } catch (err) {
        errors.push({
          slug: raw.slug || "(kosong)",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { inserted, updated, skipped, failed: errors.length, errors };
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
