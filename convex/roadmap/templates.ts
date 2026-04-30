import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, optionalUser } from "../_shared/auth";
import { templateNodeValidator, VALID_DOMAINS } from "./schema";

// ---- Limits (tight; keeps community submissions sane) ------------------

const MAX_TITLE_LEN = 120;
const MAX_DESCRIPTION_LEN = 600;
const MAX_SLUG_LEN = 80;
const MAX_FIELD_LEN = 60;
const MAX_TAGS = 20;
const MAX_NODES = 200;

const SLUG_RE = /^[a-z][a-z0-9-]*$/;

function trimMax(field: string, value: string, max: number, opts: { allowEmpty?: boolean } = {}): string {
  const trimmed = value.trim();
  if (!opts.allowEmpty && trimmed.length === 0) {
    throw new Error(`${field} tidak boleh kosong`);
  }
  if (trimmed.length > max) {
    throw new Error(`${field} maksimal ${max} karakter`);
  }
  return trimmed;
}

function normalizeSlug(raw: string): string {
  const slug = raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!slug) throw new Error("Slug wajib diisi");
  if (slug.length > MAX_SLUG_LEN) throw new Error(`Slug maksimal ${MAX_SLUG_LEN} karakter`);
  if (!SLUG_RE.test(slug)) throw new Error("Slug harus diawali huruf, hanya huruf kecil/angka/tanda hubung");
  return slug;
}

// ---- Public listing ----------------------------------------------------

export const listPublicTemplates = query({
  args: {},
  handler: async (ctx) => {
    // Sort by `order` via index — stays cheap as the table grows with
    // user-published templates.
    const all = await ctx.db
      .query("roadmapTemplates")
      .withIndex("by_order")
      .collect();
    return all
      .filter((t) => t.isPublic)
      .map((t) => {
        // Aggregate node tags into a flat unique set so the browser can
        // surface granular keywords without reading the full nodes array.
        const nodeTags = new Set<string>();
        for (const n of t.nodes) {
          for (const tag of n.tags ?? []) nodeTags.add(tag);
        }
        // Compute difficulty mix — useful for filter chips + table column.
        const difficultyMix = { beginner: 0, intermediate: 0, advanced: 0 };
        for (const n of t.nodes) {
          if (n.difficulty === "beginner") difficultyMix.beginner++;
          else if (n.difficulty === "intermediate") difficultyMix.intermediate++;
          else if (n.difficulty === "advanced") difficultyMix.advanced++;
        }
        return {
          _id: t._id,
          _creationTime: t._creationTime,
          title: t.title,
          slug: t.slug,
          domain: t.domain,
          icon: t.icon,
          color: t.color,
          description: t.description,
          tags: t.tags,
          nodeTags: Array.from(nodeTags),
          difficultyMix,
          order: t.order,
          isSystem: t.isSystem,
          authorName: t.authorName ?? null,
          nodeCount: t.nodes.length,
          totalHours: t.nodes.reduce((s, n) => s + n.estimatedHours, 0),
          manifest: t.manifest ?? null,
          config: t.config ?? null,
        };
      });
  },
});

export const getTemplateBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db
      .query("roadmapTemplates")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
  },
});

export const getTemplateById = query({
  args: { id: v.id("roadmapTemplates") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

// ---- Author-side ops ---------------------------------------------------

/** Publish user's personal roadmap as a community template. */
export const publishMyRoadmap = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    domain: v.string(),
    icon: v.string(),
    color: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
    nodes: v.array(templateNodeValidator),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    // Validate + normalize all inputs before any DB write.
    const slug = normalizeSlug(args.slug);
    const title = trimMax("Judul", args.title, MAX_TITLE_LEN);
    const description = trimMax("Deskripsi", args.description, MAX_DESCRIPTION_LEN, { allowEmpty: true });
    const icon = trimMax("Ikon", args.icon, MAX_FIELD_LEN, { allowEmpty: true }) || "BookOpen";
    const color = trimMax("Warna", args.color, MAX_FIELD_LEN, { allowEmpty: true }) || "bg-brand";
    if (!VALID_DOMAINS.has(args.domain)) throw new Error("Domain tidak valid");
    if (args.nodes.length === 0) throw new Error("Minimal 1 node");
    if (args.nodes.length > MAX_NODES) throw new Error(`Maksimal ${MAX_NODES} node per template`);
    const tags = args.tags
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, MAX_TAGS);

    // Slug uniqueness — Convex mutations are transactional so this
    // read-then-write is safe.
    const existing = await ctx.db
      .query("roadmapTemplates")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) throw new Error("Slug sudah digunakan, pilih nama lain");

    // Compute next order so author templates stack predictably AFTER
    // system templates instead of all colliding at 9999.
    const last = await ctx.db
      .query("roadmapTemplates")
      .withIndex("by_order")
      .order("desc")
      .first();
    const nextOrder = (last?.order ?? 0) + 1;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const authorName = profile?.fullName?.trim() || "Pengguna";

    return ctx.db.insert("roadmapTemplates", {
      slug,
      title,
      domain: args.domain,
      icon,
      color,
      description,
      tags,
      nodes: args.nodes,
      isPublic: true,
      isSystem: false,
      order: nextOrder,
      authorId: userId,
      authorName,
    });
  },
});

/** List templates authored by the current user. */
export const listMyTemplates = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    return ctx.db
      .query("roadmapTemplates")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .order("asc")
      .collect();
  },
});

/**
 * Aggregate user count per template. Returns a `{ [templateId]: count }`
 * map for the browser's popularity sort. Full-table scan over
 * `skillRoadmaps`; acceptable while `count(skillRoadmaps) ≪ 100k`. Move
 * to a denormalised counter on `roadmapTemplates` if it grows past that.
 */
export const getTemplateUsageCounts = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("skillRoadmaps").collect();
    const counts: Record<string, number> = {};
    for (const r of all) {
      if (!r.templateId) continue;
      const id = String(r.templateId);
      counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  },
});

/** Delete a template authored by the current user. */
export const deleteMyTemplate = mutation({
  args: { id: v.id("roadmapTemplates") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const tpl = await ctx.db.get(id);
    if (!tpl) throw new Error("Template tidak ditemukan");
    if (tpl.authorId !== userId) throw new Error("Tidak diizinkan");
    await ctx.db.delete(id);
  },
});
