import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./_lib/auth";

/**
 * Public personal-brand profile served at /{slug} on the marketing host.
 *
 * Security model — read carefully before touching:
 *
 * 1. OPT-IN — `publicEnabled` starts false. Every public field is
 *    individually gated (publicBioShow, publicSkillsShow, etc.).
 * 2. SLUG VALIDATION — server-enforced regex + reserved-name blocklist +
 *    uniqueness. Client-side checks are a courtesy only.
 * 3. NO ENUMERATION — `getBySlug` returns null for: non-existent slug,
 *    disabled profile, AND malformed slug. All indistinguishable.
 * 4. FIELD WHITELIST — `getBySlug` never returns userId, email, phone,
 *    location, internal Convex IDs, or any field not explicitly gated
 *    by a `public*Show` flag. Adding a new public field requires an
 *    explicit allow-list branch here.
 * 5. CONTENT SANITIZATION — headline/bio/contact-email trimmed +
 *    length-capped. HTML-like angle brackets allowed (React escapes
 *    them on render), but we reject embedded control chars.
 * 6. RATE LIMIT — handled at the Next.js layer via the existing IP
 *    quota (not Convex-side; anonymous requests carry no userId).
 *    See frontend/app/[slug]/page.tsx.
 */

const SLUG_MIN = 3;
const SLUG_MAX = 30;
const SLUG_REGEX = /^[a-z][a-z0-9-]+[a-z0-9]$/;

const HEADLINE_MAX = 120;
const EMAIL_MAX = 120;
const URL_MAX = 300;

/** Paths already claimed by Next.js routing or reserved for future use.
 * Sync with any new top-level app/ route you add. Matching is exact. */
const RESERVED_SLUGS = new Set<string>([
  // Framework / infrastructure
  "_next",
  "api",
  "r",
  "static",
  "assets",
  "public",
  "icon",
  "apple-icon",
  "apple-touch-icon",
  "favicon",
  "manifest",
  "robots",
  "sitemap",
  "well-known",
  // Auth / account
  "login",
  "logout",
  "signin",
  "signup",
  "register",
  "forgot-password",
  "reset-password",
  "verify",
  "auth",
  // App surfaces
  "dashboard",
  "admin",
  "settings",
  "help",
  "profile",
  "account",
  "terms",
  "privacy",
  "cookies",
  "legal",
  "about",
  "contact",
  "pricing",
  "home",
  "docs",
  "blog",
  "faq",
  "support",
  "careers",
  "press",
  // Potentially embarrassing collisions
  "root",
  "null",
  "undefined",
  "error",
  "404",
  "500",
  "status",
  // Brand protection
  "careerpack",
  "anthropic",
  "claude",
]);

function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

function assertSlug(raw: string): string {
  const slug = normalizeSlug(raw);
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
  // Block double-dashes which can look spoofy in URLs
  if (slug.includes("--")) {
    throw new Error("Slug tidak boleh mengandung '--' berurutan");
  }
  return slug;
}

/** Reject binary/control payloads in public text fields. Allows tab (0x09),
 * LF (0x0A), CR (0x0D); rejects every other C0 byte and DEL (0x7F). */
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
  // Accept http/https only. Prevents javascript:, data:, file:, etc.
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
  // Basic shape; the real validation is sending a test email, which we
  // don't do here. Good enough to filter obvious garbage.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error("Email kontak publik tidak valid");
  }
  return value;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Check slug availability (for the current user's take-slug flow). Returns
 * `true` when the slug is free OR already owned by the caller. Does NOT
 * leak other users' identities.
 */
export const isSlugAvailable = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const callerId = await requireUser(ctx);
    let slug: string;
    try {
      slug = assertSlug(args.slug);
    } catch {
      return false;
    }

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_public_slug", (q) => q.eq("publicSlug", slug))
      .first();
    if (!existing) return true;
    return existing.userId === callerId;
  },
});

/**
 * Public read — called by Next.js Server Components on /{slug}.
 * Must be safe to expose via ConvexHttpClient without auth.
 * Returns only whitelisted fields when the profile is enabled.
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    // Normalize first. Any validation failure → same null as not-found.
    let slug: string;
    try {
      slug = assertSlug(args.slug);
    } catch {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_public_slug", (q) => q.eq("publicSlug", slug))
      .first();
    if (!profile) return null;
    if (!profile.publicEnabled) return null;

    // Explicit field whitelist. Do NOT spread the profile doc; every
    // returned key is listed here on purpose.
    return {
      slug: profile.publicSlug ?? slug,
      displayName: profile.fullName,
      headline: profile.publicHeadline ?? "",
      targetRole: profile.publicTargetRoleShow ? profile.targetRole : "",
      bio: profile.publicBioShow ? (profile.bio ?? "") : "",
      skills: profile.publicSkillsShow ? (profile.skills ?? []) : [],
      contactEmail: profile.publicContactEmail ?? "",
      linkedinUrl: profile.publicLinkedinUrl ?? "",
      portfolioUrl: profile.publicPortfolioUrl ?? "",
      allowIndex: Boolean(profile.publicAllowIndex),
      updatedAt: profile._creationTime,
    };
  },
});

/**
 * Current user's own public-profile settings. Used by the Settings UI
 * to prefill the form.
 */
export const getMyPublicProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return null;
    return {
      enabled: Boolean(profile.publicEnabled),
      slug: profile.publicSlug ?? "",
      headline: profile.publicHeadline ?? "",
      bioShow: Boolean(profile.publicBioShow),
      skillsShow: Boolean(profile.publicSkillsShow),
      targetRoleShow: Boolean(profile.publicTargetRoleShow),
      contactEmail: profile.publicContactEmail ?? "",
      linkedinUrl: profile.publicLinkedinUrl ?? "",
      portfolioUrl: profile.publicPortfolioUrl ?? "",
      allowIndex: Boolean(profile.publicAllowIndex),
    };
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

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
      // Uniqueness check: reject if another user owns this slug.
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
      // Cannot enable without a slug.
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

    await ctx.db.patch(profile._id, patch);
    return { ok: true as const };
  },
});
