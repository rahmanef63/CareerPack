import { query } from "../_generated/server";
import { v } from "convex/values";
import { optionalUser, requireUser } from "../_shared/auth";
import {
  buildAutoBlocks,
  DEFAULT_AUTO_TOGGLES,
  type AutoToggles,
  type AutoCVInput,
  type AutoPortfolioItem,
} from "./autoBlocks";
import { buildBrandingPayload } from "./brandingPayload";

// ---------------------------------------------------------------------
// Current user / private profile
// ---------------------------------------------------------------------

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const avatarUrl = profile?.avatarStorageId
      ? await ctx.storage.getUrl(profile.avatarStorageId)
      : null;

    return { ...user, profile, avatarUrl };
  },
});

export const userExistsByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    return !!user;
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return null;

    const [applications, goals, roadmaps, interviews] = await Promise.all([
      ctx.db.query("jobApplications").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("careerGoals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("skillRoadmaps").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("mockInterviews").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);

    const activeGoals = goals.filter((g) => g.status === "active").length;
    const completedGoals = goals.filter((g) => g.status === "completed").length;
    const avgSkillProgress = roadmaps.length > 0
      ? roadmaps.reduce((sum, r) => sum + r.progress, 0) / roadmaps.length
      : 0;
    const recentInterviews = interviews.filter(
      (i) => i.completedAt && i.completedAt > Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).length;

    return {
      totalApplications: applications.length,
      activeGoals,
      completedGoals,
      avgSkillProgress: Math.round(avgSkillProgress),
      recentInterviews,
      applicationsByStatus: {
        applied: applications.filter((a) => a.status === "applied").length,
        screening: applications.filter((a) => a.status === "screening").length,
        interview: applications.filter((a) => a.status === "interview").length,
        offer: applications.filter((a) => a.status === "offer").length,
        rejected: applications.filter((a) => a.status === "rejected").length,
      },
    };
  },
});

// ---------------------------------------------------------------------
// Public profile (/[slug])
// ---------------------------------------------------------------------

const SLUG_MIN = 3;
const SLUG_MAX = 30;
const SLUG_REGEX = /^[a-z][a-z0-9-]+[a-z0-9]$/;

const RESERVED_SLUGS = new Set<string>([
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
  "login",
  "logout",
  "signin",
  "signup",
  "register",
  "forgot-password",
  "reset-password",
  "verify",
  "auth",
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
  "root",
  "null",
  "undefined",
  "error",
  "404",
  "500",
  "status",
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
  if (slug.includes("--")) {
    throw new Error("Slug tidak boleh mengandung '--' berurutan");
  }
  return slug;
}

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

export const listIndexableSlugs = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("userProfiles").collect();
    return profiles
      .filter(
        (p) =>
          p.publicEnabled === true &&
          p.publicAllowIndex === true &&
          typeof p.publicSlug === "string" &&
          p.publicSlug.length > 0,
      )
      .map((p) => p.publicSlug as string);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
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

    const avatarUrl =
      profile.publicAvatarShow && profile.avatarStorageId
        ? await ctx.storage.getUrl(profile.avatarStorageId)
        : null;

    let portfolio: Array<{
      id: string;
      title: string;
      description: string;
      category: string;
      link: string;
      date: string;
      techStack: string[];
      featured: boolean;
      coverEmoji: string | null;
      coverGradient: string | null;
      coverUrl: string | null;
    }> = [];
    if (profile.publicPortfolioShow) {
      const items = await ctx.db
        .query("portfolioItems")
        .withIndex("by_user", (q) => q.eq("userId", profile.userId))
        .collect();
      portfolio = await Promise.all(
        items.map(async (item) => ({
          id: item._id,
          title: item.title,
          description: item.description,
          category: item.category,
          link: item.link ?? "",
          date: item.date,
          techStack: item.techStack ?? [],
          featured: item.featured,
          coverEmoji: item.coverEmoji ?? null,
          coverGradient: item.coverGradient ?? null,
          coverUrl: item.coverStorageId
            ? await ctx.storage.getUrl(item.coverStorageId)
            : null,
        })),
      );
      portfolio.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.date.localeCompare(a.date);
      });
    }

    // Resolve final block list. Auto mode rebuilds from the user's
    // CV / Portofolio data on every read so the page stays in sync
    // when those source feeds change. Custom mode returns the
    // user-authored blocks (filtering out hidden ones).
    const mode = profile.publicMode ?? "auto";
    let blocks: ReadonlyArray<{ id: string; type: string; payload: unknown }> = [];
    if (mode === "custom") {
      blocks = (profile.publicBlocks ?? []).filter((b) => !b.hidden);
    } else {
      // ---- Auto: pull CV + portfolio + apply toggles ----
      // Newest first — without `.order("desc")` Convex returns the
      // oldest doc, which on a fresh account is the seeded demo CV
      // and overrides anything imported via Quick Fill.
      const cv = await ctx.db
        .query("cvs")
        .withIndex("by_user", (q) => q.eq("userId", profile.userId))
        .order("desc")
        .first();
      const portfolioRows = await ctx.db
        .query("portfolioItems")
        .withIndex("by_user", (q) => q.eq("userId", profile.userId))
        .collect();
      const portfolioWithUrl: AutoPortfolioItem[] = await Promise.all(
        portfolioRows.map(async (p) => ({
          id: p._id,
          title: p.title,
          description: p.description,
          category: p.category,
          link: p.link ?? undefined,
          date: p.date,
          featured: p.featured,
          coverEmoji: p.coverEmoji ?? undefined,
          coverUrl: p.coverStorageId
            ? await ctx.storage.getUrl(p.coverStorageId)
            : null,
        })),
      );
      const stored = profile.publicAutoToggles ?? {};
      const toggles: AutoToggles = {
        showExperience: stored.showExperience ?? DEFAULT_AUTO_TOGGLES.showExperience,
        showEducation: stored.showEducation ?? DEFAULT_AUTO_TOGGLES.showEducation,
        showCertifications:
          stored.showCertifications ?? DEFAULT_AUTO_TOGGLES.showCertifications,
        showProjects: stored.showProjects ?? DEFAULT_AUTO_TOGGLES.showProjects,
        showSocial: stored.showSocial ?? DEFAULT_AUTO_TOGGLES.showSocial,
      };
      blocks = buildAutoBlocks({
        profile: {
          bio: profile.bio ?? undefined,
          skills: profile.skills ?? undefined,
          publicBioShow: profile.publicBioShow ?? false,
          publicSkillsShow: profile.publicSkillsShow ?? false,
          publicLinkedinUrl: profile.publicLinkedinUrl ?? undefined,
          publicPortfolioUrl: profile.publicPortfolioUrl ?? undefined,
          publicContactEmail: profile.publicContactEmail ?? undefined,
        },
        cv: (cv as AutoCVInput | null) ?? null,
        portfolio: portfolioWithUrl,
        toggles,
        publicPortfolioShow: Boolean(profile.publicPortfolioShow),
      });
    }

    // Pull the user's primary CV (newest first) so dynamic templates
    // can populate hero / about / skills / projects / experience from
    // real CV data instead of mock content. Cheap — single doc.
    const cvDoc = await ctx.db
      .query("cvs")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .order("desc")
      .first();

    const branding = buildBrandingPayload({
      profile: {
        fullName: profile.fullName,
        publicHeadline: profile.publicHeadline ?? "",
        targetRole: profile.publicTargetRoleShow ? profile.targetRole : "",
        location: profile.location ?? "",
        bio: profile.publicBioShow ? (profile.bio ?? "") : "",
        skills: profile.publicSkillsShow ? (profile.skills ?? []) : [],
        avatarUrl,
        contactEmail: profile.publicContactEmail ?? "",
        linkedinUrl: profile.publicLinkedinUrl ?? "",
        portfolioUrl: profile.publicPortfolioUrl ?? "",
      },
      cv: cvDoc,
      portfolio,
    });

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
      avatarUrl,
      portfolio,
      // Personal Branding builder additions — default theme=template-v2
      // (Editorial Cream) when unset so new and legacy profiles render.
      mode,
      theme: profile.publicTheme ?? "template-v2",
      headerBg: profile.publicHeaderBg ?? null,
      accent: profile.publicAccent ?? null,
      blocks,
      // Dynamic data feed for the iframe templates — all sections
      // user has populated, with empty ones omitted so the hydrator
      // script can hide them.
      branding,
      updatedAt: profile._creationTime,
    };
  },
});

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
      avatarShow: Boolean(profile.publicAvatarShow),
      portfolioShow: Boolean(profile.publicPortfolioShow),
      mode: profile.publicMode ?? "auto",
      autoToggles: profile.publicAutoToggles ?? null,
      theme: profile.publicTheme ?? "template-v2",
      headerBg: profile.publicHeaderBg ?? null,
      accent: profile.publicAccent ?? null,
      htmlExport: Boolean(profile.publicHtmlExport),
      embedExport: Boolean(profile.publicEmbedExport),
      promptExport: Boolean(profile.publicPromptExport),
      blocks: profile.publicBlocks ?? [],
    };
  },
});
