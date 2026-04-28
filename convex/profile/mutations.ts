import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser } from "../_shared/auth";
import {
  sanitizeBlocks,
  sanitizeHeaderBg,
  sanitizeAccent,
} from "./blocks";

const SLUG_MIN = 3;
const SLUG_MAX = 30;
const SLUG_REGEX = /^[a-z][a-z0-9-]+[a-z0-9]$/;

const HEADLINE_MAX = 120;
const EMAIL_MAX = 120;
const URL_MAX = 300;
const AVAILABILITY_NOTE_MAX = 80;
const CTA_LABEL_MAX = 40;

const ALLOWED_SECTIONS = new Set([
  "about",
  "skills",
  "experience",
  "education",
  "certifications",
  "languages",
  "projects",
  "contact",
]);

const RESERVED_SLUGS = new Set<string>([
  "_next", "api", "r", "static", "assets", "public",
  "icon", "apple-icon", "apple-touch-icon", "favicon",
  "manifest", "robots", "sitemap", "well-known",
  "login", "logout", "signin", "signup", "register",
  "forgot-password", "reset-password", "verify", "auth",
  "dashboard", "admin", "settings", "help", "profile",
  "account", "terms", "privacy", "cookies", "legal",
  "about", "contact", "pricing", "home", "docs", "blog",
  "faq", "support", "careers", "press", "root", "null",
  "undefined", "error", "404", "500", "status",
  "careerpack", "anthropic", "claude",
]);

function assertSlug(raw: string): string {
  const slug = raw.trim().toLowerCase();
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX) {
    throw new Error(`Slug harus ${SLUG_MIN}-${SLUG_MAX} karakter`);
  }
  if (!SLUG_REGEX.test(slug)) {
    throw new Error(
      "Slug hanya boleh huruf kecil, angka, dan tanda '-'. Harus diawali huruf, diakhiri huruf/angka.",
    );
  }
  if (RESERVED_SLUGS.has(slug)) {
    throw new Error("Slug ini dipakai sistem, pilih yang lain");
  }
  if (slug.includes("--")) {
    throw new Error("Slug tidak boleh mengandung '--' berurutan");
  }
  return slug;
}

function containsControlChar(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 9 || code === 10 || code === 13) continue;
    if (code < 32 || code === 127) return true;
  }
  return false;
}

function assertShortText(value: string, max: number, label: string): string {
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Error(`${label} maksimal ${max} karakter`);
  if (containsControlChar(trimmed)) {
    throw new Error(`${label} mengandung karakter tidak valid`);
  }
  return trimmed;
}

function assertUrl(raw: string, label: string): string {
  const value = raw.trim();
  if (value.length === 0) return "";
  if (value.length > URL_MAX) throw new Error(`${label} terlalu panjang`);
  if (!/^https?:\/\//i.test(value)) {
    throw new Error(`${label} harus diawali http:// atau https://`);
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error(`${label} harus http atau https`);
    }
    return url.toString();
  } catch {
    throw new Error(`${label} bukan URL valid`);
  }
}

function assertEmail(raw: string): string {
  const value = raw.trim();
  if (value.length === 0) return "";
  if (value.length > EMAIL_MAX) throw new Error("Email terlalu panjang");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error("Email kontak publik tidak valid");
  }
  return value;
}

export const createOrUpdateProfile = mutation({
  args: {
    fullName: v.string(),
    phone: v.optional(v.string()),
    location: v.string(),
    targetRole: v.string(),
    experienceLevel: v.string(),
    skills: v.array(v.string()),
    interests: v.array(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const profileData = { userId, ...args };

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, profileData);
      return existingProfile._id;
    }
    return await ctx.db.insert("userProfiles", profileData);
  },
});

export const updateAvatar = mutation({
  args: {
    storageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    if (args.storageId !== undefined) {
      const record = await ctx.db
        .query("files")
        .withIndex("by_storage", (q) => q.eq("storageId", args.storageId!))
        .first();
      if (!record || record.tenantId !== userId.toString()) {
        throw new Error("File tidak ditemukan");
      }
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      throw new Error("Isi profil dulu lalu coba lagi");
    }

    await ctx.db.patch(profile._id, {
      avatarStorageId: args.storageId,
    });
  },
});

export const updateMyPublicProfile = mutation({
  args: {
    enabled: v.optional(v.boolean()),
    slug: v.optional(v.string()),
    headline: v.optional(v.string()),
    bioShow: v.optional(v.boolean()),
    skillsShow: v.optional(v.boolean()),
    targetRoleShow: v.optional(v.boolean()),
    contactEmail: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
    allowIndex: v.optional(v.boolean()),
    avatarShow: v.optional(v.boolean()),
    portfolioShow: v.optional(v.boolean()),
    /* ----- Personal Branding builder ------------------------------ */
    mode: v.optional(v.union(v.literal("auto"), v.literal("custom"))),
    autoToggles: v.optional(
      v.object({
        showExperience: v.optional(v.boolean()),
        showEducation: v.optional(v.boolean()),
        showCertifications: v.optional(v.boolean()),
        showProjects: v.optional(v.boolean()),
        showSocial: v.optional(v.boolean()),
        showLanguages: v.optional(v.boolean()),
      }),
    ),
    availableForHire: v.optional(v.boolean()),
    availabilityNote: v.optional(v.string()),
    ctaLabel: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    ctaType: v.optional(
      v.union(
        v.literal("link"),
        v.literal("email"),
        v.literal("calendly"),
        v.literal("download"),
      ),
    ),
    sectionOrder: v.optional(v.array(v.string())),
    theme: v.optional(
      v.union(
        v.literal("linktree"),
        v.literal("bento"),
        v.literal("magazine"),
        v.literal("template-v1"),
        v.literal("template-v2"),
        v.literal("template-v3"),
      ),
    ),
    headerBg: v.optional(
      v.object({
        kind: v.union(
          v.literal("gradient"),
          v.literal("solid"),
          v.literal("image"),
          v.literal("none"),
        ),
        value: v.string(),
      }),
    ),
    accent: v.optional(v.string()),
    style: v.optional(
      v.object({
        primary: v.optional(v.string()),
        font: v.optional(
          v.union(
            v.literal("sans"),
            v.literal("serif"),
            v.literal("mono"),
          ),
        ),
        radius: v.optional(
          v.union(
            v.literal("none"),
            v.literal("sm"),
            v.literal("md"),
            v.literal("lg"),
            v.literal("full"),
          ),
        ),
        density: v.optional(
          v.union(
            v.literal("compact"),
            v.literal("normal"),
            v.literal("spacious"),
          ),
        ),
      }),
    ),
    /* Share & Export opt-ins (see profile/schema.ts). */
    htmlExport: v.optional(v.boolean()),
    embedExport: v.optional(v.boolean()),
    promptExport: v.optional(v.boolean()),
    blocks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          type: v.string(),
          hidden: v.optional(v.boolean()),
          payload: v.any(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!profile) {
      throw new Error("Profil belum dibuat — lengkapi profil dulu di Pengaturan");
    }

    const patch: Record<string, unknown> = {};

    if (args.slug !== undefined) {
      const slug = assertSlug(args.slug);
      const collision = await ctx.db
        .query("userProfiles")
        .withIndex("by_public_slug", (q) => q.eq("publicSlug", slug))
        .first();
      if (collision && collision.userId !== userId) {
        throw new Error("Slug sudah dipakai, pilih yang lain");
      }
      patch.publicSlug = slug;
    }

    if (args.enabled !== undefined) {
      if (args.enabled) {
        const hasSlug =
          args.slug !== undefined
            ? Boolean(args.slug.trim())
            : Boolean(profile.publicSlug);
        if (!hasSlug) {
          throw new Error("Tetapkan slug sebelum mengaktifkan profil publik");
        }
      }
      patch.publicEnabled = args.enabled;
    }

    if (args.headline !== undefined) {
      patch.publicHeadline = assertShortText(args.headline, HEADLINE_MAX, "Headline");
    }
    if (args.bioShow !== undefined) patch.publicBioShow = args.bioShow;
    if (args.skillsShow !== undefined) patch.publicSkillsShow = args.skillsShow;
    if (args.targetRoleShow !== undefined) patch.publicTargetRoleShow = args.targetRoleShow;
    if (args.contactEmail !== undefined) patch.publicContactEmail = assertEmail(args.contactEmail);
    if (args.linkedinUrl !== undefined) patch.publicLinkedinUrl = assertUrl(args.linkedinUrl, "LinkedIn");
    if (args.portfolioUrl !== undefined) patch.publicPortfolioUrl = assertUrl(args.portfolioUrl, "Portfolio");
    if (args.allowIndex !== undefined) patch.publicAllowIndex = args.allowIndex;
    if (args.avatarShow !== undefined) patch.publicAvatarShow = args.avatarShow;
    if (args.portfolioShow !== undefined) patch.publicPortfolioShow = args.portfolioShow;

    if (args.mode !== undefined) patch.publicMode = args.mode;
    if (args.autoToggles !== undefined) patch.publicAutoToggles = args.autoToggles;
    if (args.theme !== undefined) patch.publicTheme = args.theme;
    if (args.headerBg !== undefined) {
      const cleaned = sanitizeHeaderBg(args.headerBg);
      if (!cleaned) throw new Error("Header background tidak valid");
      patch.publicHeaderBg = cleaned;
    }
    if (args.accent !== undefined) {
      if (args.accent === "") {
        patch.publicAccent = undefined;
      } else {
        const cleaned = sanitizeAccent(args.accent);
        if (!cleaned) throw new Error("Aksen warna harus format hex #rrggbb");
        patch.publicAccent = cleaned;
      }
    }
    if (args.style !== undefined) {
      // Whitelist + sanitize — primary color must be hex, the rest are
      // already constrained by the validator literals.
      const HEX_RE = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;
      const cleaned: Record<string, string> = {};
      if (args.style.primary && HEX_RE.test(args.style.primary)) {
        cleaned.primary = args.style.primary.toLowerCase();
      }
      if (args.style.font) cleaned.font = args.style.font;
      if (args.style.radius) cleaned.radius = args.style.radius;
      if (args.style.density) cleaned.density = args.style.density;
      patch.publicStyle = Object.keys(cleaned).length > 0 ? cleaned : undefined;
    }
    if (args.htmlExport !== undefined) patch.publicHtmlExport = args.htmlExport;
    if (args.embedExport !== undefined) patch.publicEmbedExport = args.embedExport;
    if (args.promptExport !== undefined) patch.publicPromptExport = args.promptExport;
    if (args.blocks !== undefined) {
      patch.publicBlocks = sanitizeBlocks(args.blocks);
    }

    if (args.availableForHire !== undefined) {
      patch.publicAvailableForHire = args.availableForHire;
    }
    if (args.availabilityNote !== undefined) {
      patch.publicAvailabilityNote = assertShortText(
        args.availabilityNote,
        AVAILABILITY_NOTE_MAX,
        "Catatan ketersediaan",
      );
    }
    if (args.ctaLabel !== undefined) {
      patch.publicCtaLabel = assertShortText(
        args.ctaLabel,
        CTA_LABEL_MAX,
        "Label CTA",
      );
    }
    if (args.ctaUrl !== undefined) {
      const raw = args.ctaUrl.trim();
      if (raw.length === 0) {
        patch.publicCtaUrl = "";
      } else if (raw.length > URL_MAX) {
        throw new Error("URL CTA terlalu panjang");
      } else if (raw.startsWith("mailto:")) {
        // Accept mailto: as-is for type=email — assertEmail validates
        // the address part. Strip the prefix before sending in.
        const addr = raw.slice("mailto:".length);
        if (assertEmail(addr).length === 0) {
          throw new Error("Alamat email pada CTA tidak valid");
        }
        patch.publicCtaUrl = `mailto:${addr.trim()}`;
      } else {
        patch.publicCtaUrl = assertUrl(raw, "URL CTA");
      }
    }
    if (args.ctaType !== undefined) patch.publicCtaType = args.ctaType;
    if (args.sectionOrder !== undefined) {
      const seen = new Set<string>();
      const cleaned: string[] = [];
      for (const s of args.sectionOrder) {
        const k = s.trim();
        if (!ALLOWED_SECTIONS.has(k)) continue;
        if (seen.has(k)) continue;
        seen.add(k);
        cleaned.push(k);
      }
      patch.publicSectionOrder = cleaned;
    }

    await ctx.db.patch(profile._id, patch);
    return { ok: true as const };
  },
});
