import { mutation, query, type MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { optionalUser, requireUser } from "../_shared/auth";

const MAX_SAVED = 50;
const MAX_SLUG_LEN = 80;

function trimSlug(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) throw new Error("Slug tidak boleh kosong");
  if (trimmed.length > MAX_SLUG_LEN) {
    throw new Error(`Slug maksimal ${MAX_SLUG_LEN} karakter`);
  }
  return trimmed;
}

async function getOrCreateDoc(ctx: MutationCtx, userId: Id<"users">) {
  const existing = await ctx.db
    .query("roadmapSaved")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  if (existing) return existing;
  const id = await ctx.db.insert("roadmapSaved", { userId, slugs: [] });
  const fresh = await ctx.db.get(id);
  if (!fresh) throw new Error("Gagal memuat data tersimpan");
  return fresh;
}

/**
 * Returns the user's saved-template slugs joined with public template
 * metadata so the "Skill Saya" grid can render the same card shape as
 * "Cari Skills" in one query (no client-side join).
 *
 * Slugs that no longer match a public template are filtered out — the
 * source template may have been deleted or made private. The doc is
 * not auto-pruned to avoid races; pruning happens on next save/remove.
 */
export const listSavedTemplates = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];

    const doc = await ctx.db
      .query("roadmapSaved")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!doc || doc.slugs.length === 0) return [];

    const out = [];
    for (const slug of doc.slugs) {
      const tpl = await ctx.db
        .query("roadmapTemplates")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
      if (!tpl || !tpl.isPublic) continue;

      const nodeTags = new Set<string>();
      for (const n of tpl.nodes) {
        for (const tag of n.tags ?? []) nodeTags.add(tag);
      }
      const difficultyMix = { beginner: 0, intermediate: 0, advanced: 0 };
      for (const n of tpl.nodes) {
        if (n.difficulty === "beginner") difficultyMix.beginner++;
        else if (n.difficulty === "intermediate") difficultyMix.intermediate++;
        else if (n.difficulty === "advanced") difficultyMix.advanced++;
      }

      out.push({
        _id: tpl._id,
        _creationTime: tpl._creationTime,
        title: tpl.title,
        slug: tpl.slug,
        domain: tpl.domain,
        icon: tpl.icon,
        color: tpl.color,
        description: tpl.description,
        tags: tpl.tags ?? [],
        nodeTags: Array.from(nodeTags),
        difficultyMix,
        isSystem: tpl.isSystem,
        authorName: tpl.authorName ?? null,
        nodeCount: tpl.nodes.length,
        totalHours: tpl.nodes.reduce((s, n) => s + n.estimatedHours, 0),
      });
    }
    return out;
  },
});

export const addSavedTemplate = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const slug = trimSlug(args.slug);

    const tpl = await ctx.db
      .query("roadmapTemplates")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!tpl || !tpl.isPublic) {
      throw new Error("Template tidak ditemukan");
    }

    const doc = await getOrCreateDoc(ctx, userId);
    if (doc.slugs.includes(slug)) return doc._id;
    if (doc.slugs.length >= MAX_SAVED) {
      throw new Error(`Maksimal ${MAX_SAVED} skill tersimpan`);
    }

    await ctx.db.patch(doc._id, { slugs: [...doc.slugs, slug] });
    return doc._id;
  },
});

export const removeSavedTemplate = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const slug = trimSlug(args.slug);

    const doc = await ctx.db
      .query("roadmapSaved")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!doc) return;

    const next = doc.slugs.filter((s) => s !== slug);
    if (next.length === doc.slugs.length) return;
    await ctx.db.patch(doc._id, { slugs: next });
  },
});
