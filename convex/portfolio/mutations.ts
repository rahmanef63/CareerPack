import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc } from "../_shared/auth";
import { makeBulkDelete } from "../_shared/bulkDelete";
import { portfolioMediaValidator, portfolioLinkValidator } from "./schema";

const CATEGORY_WHITELIST = new Set([
  "project",
  "certification",
  "publication",
  "design",
  "writing",
  "speaking",
  "award",
  "openSource",
  "volunteer",
  "music",
  "photography",
  "teaching",
  "research",
  "video",
  "other",
]);

const MAX_TITLE = 200;
const MAX_DESCRIPTION = 4000;
const MAX_FIELD = 200;
const MAX_OUTCOMES = 12;
const MAX_OUTCOME_LEN = 240;
const MAX_COLLABORATORS = 30;
const MAX_SKILLS = 30;
const MAX_TECH = 30;
const MAX_LINKS = 12;
const MAX_MEDIA = 30;

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

function normalizeCategory(raw: string): string {
  if (!CATEGORY_WHITELIST.has(raw)) {
    throw new Error("Kategori tidak valid");
  }
  return raw;
}

function sanitizeStringList(field: string, list: ReadonlyArray<string>, max: number, maxLen = MAX_FIELD): string[] {
  if (list.length > max) throw new Error(`${field} maksimal ${max} entri`);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of list) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (trimmed.length > maxLen) {
      throw new Error(`${field} per entri maksimal ${maxLen} karakter`);
    }
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

const argsBase = {
  title: v.string(),
  description: v.string(),
  category: v.string(),
  coverEmoji: v.optional(v.string()),
  coverGradient: v.optional(v.string()),
  coverStorageId: v.optional(v.string()),
  media: v.optional(v.array(portfolioMediaValidator)),
  link: v.optional(v.string()),
  links: v.optional(v.array(portfolioLinkValidator)),
  techStack: v.optional(v.array(v.string())),
  date: v.string(),
  featured: v.optional(v.boolean()),
  role: v.optional(v.string()),
  client: v.optional(v.string()),
  duration: v.optional(v.string()),
  outcomes: v.optional(v.array(v.string())),
  collaborators: v.optional(v.array(v.string())),
  skills: v.optional(v.array(v.string())),
  brandingShow: v.optional(v.boolean()),
  sortOrder: v.optional(v.number()),
};

function buildPayload(args: {
  title: string; description: string; category: string;
  coverEmoji?: string; coverGradient?: string; coverStorageId?: string;
  media?: ReadonlyArray<{ storageId: string; kind: string; caption?: string }>;
  link?: string;
  links?: ReadonlyArray<{ url: string; label: string; kind: string }>;
  techStack?: ReadonlyArray<string>;
  date: string;
  featured?: boolean;
  role?: string; client?: string; duration?: string;
  outcomes?: ReadonlyArray<string>;
  collaborators?: ReadonlyArray<string>;
  skills?: ReadonlyArray<string>;
  brandingShow?: boolean;
  sortOrder?: number;
}) {
  const title = trimMax("Judul", args.title, MAX_TITLE);
  const description = trimMax("Deskripsi", args.description, MAX_DESCRIPTION);
  const category = normalizeCategory(args.category);

  const media = (args.media ?? []).slice(0, MAX_MEDIA).map((m) => ({
    storageId: trimMax("Media storageId", m.storageId, 200),
    kind: trimMax("Media kind", m.kind, 30),
    ...(m.caption && m.caption.trim()
      ? { caption: trimMax("Caption", m.caption, 200) }
      : {}),
  }));

  const links = (args.links ?? []).slice(0, MAX_LINKS).map((l) => ({
    url: trimMax("URL", l.url, 600),
    label: trimMax("Label tautan", l.label, MAX_FIELD),
    kind: trimMax("Tipe tautan", l.kind, 30),
  }));

  const techStack = sanitizeStringList(
    "Tech stack",
    args.techStack ?? [],
    MAX_TECH,
  );
  const outcomes = sanitizeStringList(
    "Outcome",
    args.outcomes ?? [],
    MAX_OUTCOMES,
    MAX_OUTCOME_LEN,
  );
  const collaborators = sanitizeStringList(
    "Kolaborator",
    args.collaborators ?? [],
    MAX_COLLABORATORS,
  );
  const skills = sanitizeStringList(
    "Skill",
    args.skills ?? [],
    MAX_SKILLS,
  );

  const link = args.link ? args.link.trim() : undefined;
  // Promote first media image into legacy coverStorageId so old card
  // renderers keep working without reading `media[]`.
  const cover = media.find((m) => m.kind === "image");
  const coverStorageId = cover?.storageId ?? args.coverStorageId;

  return {
    title,
    description,
    category,
    coverEmoji: args.coverEmoji,
    coverGradient: args.coverGradient,
    coverStorageId,
    media: media.length > 0 ? media : undefined,
    link: link || undefined,
    links: links.length > 0 ? links : undefined,
    techStack,
    date: trimMax("Tanggal", args.date, 20),
    featured: args.featured ?? false,
    role: args.role && args.role.trim()
      ? trimMax("Peran", args.role, MAX_FIELD)
      : undefined,
    client: args.client && args.client.trim()
      ? trimMax("Klien", args.client, MAX_FIELD)
      : undefined,
    duration: args.duration && args.duration.trim()
      ? trimMax("Durasi", args.duration, MAX_FIELD)
      : undefined,
    outcomes: outcomes.length > 0 ? outcomes : undefined,
    collaborators: collaborators.length > 0 ? collaborators : undefined,
    skills: skills.length > 0 ? skills : undefined,
    brandingShow: args.brandingShow,
    sortOrder: args.sortOrder,
  };
}

export const createPortfolioItem = mutation({
  args: argsBase,
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const payload = buildPayload(args);
    return await ctx.db.insert("portfolioItems", { userId, ...payload });
  },
});

export const updatePortfolioItem = mutation({
  args: {
    itemId: v.id("portfolioItems"),
    clearCover: v.optional(v.boolean()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    coverEmoji: v.optional(v.string()),
    coverGradient: v.optional(v.string()),
    coverStorageId: v.optional(v.string()),
    media: v.optional(v.array(portfolioMediaValidator)),
    link: v.optional(v.string()),
    links: v.optional(v.array(portfolioLinkValidator)),
    techStack: v.optional(v.array(v.string())),
    date: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    role: v.optional(v.string()),
    client: v.optional(v.string()),
    duration: v.optional(v.string()),
    outcomes: v.optional(v.array(v.string())),
    collaborators: v.optional(v.array(v.string())),
    skills: v.optional(v.array(v.string())),
    brandingShow: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.itemId, "Portofolio");

    // Build a partial patch: only apply fields explicitly passed in.
    const patch: Record<string, unknown> = {};

    if (args.title !== undefined || args.description !== undefined ||
        args.category !== undefined || args.date !== undefined) {
      // If any rebuild-required field was set, full rebuild path uses
      // current fields where omitted. We need to fetch existing.
    }

    // Single-field patches that don't need full rebuild:
    const passthrough: Array<keyof typeof args> = [
      "coverEmoji", "coverGradient", "coverStorageId", "link", "featured",
      "role", "client", "duration", "brandingShow", "sortOrder",
    ];
    for (const k of passthrough) {
      if (args[k] !== undefined) patch[k] = args[k];
    }

    if (args.title !== undefined) patch.title = trimMax("Judul", args.title, MAX_TITLE);
    if (args.description !== undefined) {
      patch.description = trimMax("Deskripsi", args.description, MAX_DESCRIPTION);
    }
    if (args.category !== undefined) patch.category = normalizeCategory(args.category);
    if (args.date !== undefined) patch.date = trimMax("Tanggal", args.date, 20);

    if (args.media !== undefined) {
      const media = args.media.slice(0, MAX_MEDIA).map((m) => ({
        storageId: trimMax("Media storageId", m.storageId, 200),
        kind: trimMax("Media kind", m.kind, 30),
        ...(m.caption && m.caption.trim()
          ? { caption: trimMax("Caption", m.caption, 200) }
          : {}),
      }));
      patch.media = media.length > 0 ? media : undefined;
      // Keep coverStorageId in sync with first image when media is set.
      const cover = media.find((m) => m.kind === "image");
      if (cover) patch.coverStorageId = cover.storageId;
    }
    if (args.links !== undefined) {
      const links = args.links.slice(0, MAX_LINKS).map((l) => ({
        url: trimMax("URL", l.url, 600),
        label: trimMax("Label tautan", l.label, MAX_FIELD),
        kind: trimMax("Tipe tautan", l.kind, 30),
      }));
      patch.links = links.length > 0 ? links : undefined;
    }
    if (args.techStack !== undefined) {
      patch.techStack = sanitizeStringList("Tech stack", args.techStack, MAX_TECH);
    }
    if (args.outcomes !== undefined) {
      const sanitized = sanitizeStringList("Outcome", args.outcomes, MAX_OUTCOMES, MAX_OUTCOME_LEN);
      patch.outcomes = sanitized.length > 0 ? sanitized : undefined;
    }
    if (args.collaborators !== undefined) {
      const sanitized = sanitizeStringList("Kolaborator", args.collaborators, MAX_COLLABORATORS);
      patch.collaborators = sanitized.length > 0 ? sanitized : undefined;
    }
    if (args.skills !== undefined) {
      const sanitized = sanitizeStringList("Skill", args.skills, MAX_SKILLS);
      patch.skills = sanitized.length > 0 ? sanitized : undefined;
    }

    if (args.clearCover) patch.coverStorageId = undefined;

    await ctx.db.patch(args.itemId, patch);
  },
});

export const deletePortfolioItem = mutation({
  args: { itemId: v.id("portfolioItems") },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.itemId, "Portofolio");
    await ctx.db.delete(args.itemId);
  },
});

export const bulkDeletePortfolioItems = makeBulkDelete(
  "portfolioItems",
  "Portofolio",
);

export const togglePortfolioFeatured = mutation({
  args: { itemId: v.id("portfolioItems") },
  handler: async (ctx, args) => {
    const item = await requireOwnedDoc(ctx, args.itemId, "Portofolio");
    await ctx.db.patch(args.itemId, { featured: !item.featured });
  },
});

export const togglePortfolioBrandingShow = mutation({
  args: { itemId: v.id("portfolioItems"), show: v.boolean() },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.itemId, "Portofolio");
    await ctx.db.patch(args.itemId, { brandingShow: args.show });
  },
});
