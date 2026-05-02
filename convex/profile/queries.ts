import { query, internalQuery } from "../_generated/server";
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

/**
 * Profile completeness — gauge + actionable suggestions for the
 * dashboard. Returns 0-100 score plus an ordered list of unfinished
 * items so the UI can render a "tambah X dulu" call-to-action.
 *
 * Weights (sum 100): basics 30 (fullName 5 / location 5 / targetRole 10 /
 * experienceLevel 10), bio 10, skills 15 (≥3 skills), CV attached 20,
 * portfolio item 10, public profile enabled 10, contact link 5
 * (linkedin or portfolio URL).
 */
export const getProfileCompleteness = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const cv = await ctx.db
      .query("cvs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const portfolio = await ctx.db
      .query("portfolioItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    interface Item {
      id: string;
      label: string;
      points: number;
      done: boolean;
      hint: string;
      href?: string;
    }

    const items: Item[] = [
      {
        id: "fullName",
        label: "Nama lengkap",
        points: 5,
        done: !!profile?.fullName && profile.fullName.trim().length >= 2,
        hint: "Tambah nama lengkap di Profil",
        href: "/dashboard/settings",
      },
      {
        id: "location",
        label: "Lokasi",
        points: 5,
        done: !!profile?.location && profile.location.trim().length >= 2,
        hint: "Tambah kota / negara untuk match lowongan lokal",
        href: "/dashboard/settings",
      },
      {
        id: "targetRole",
        label: "Target role",
        points: 10,
        done: !!profile?.targetRole && profile.targetRole.trim().length >= 3,
        hint: "Set target role supaya matcher bisa rekomendasi lowongan",
        href: "/dashboard/settings",
      },
      {
        id: "experienceLevel",
        label: "Level pengalaman",
        points: 10,
        done: !!profile?.experienceLevel && profile.experienceLevel.trim().length > 0,
        hint: "Pilih junior / mid-level / senior / lead",
        href: "/dashboard/settings",
      },
      {
        id: "bio",
        label: "Bio singkat",
        points: 10,
        done: !!profile?.bio && profile.bio.trim().length >= 30,
        hint: "Tulis 1-2 kalimat tentang dirimu",
        href: "/dashboard/personal-branding",
      },
      {
        id: "skills",
        label: "Minimum 3 skill",
        points: 15,
        done: (profile?.skills ?? []).filter((s) => s.trim().length > 0).length >= 3,
        hint: "Tambah skill teknis untuk match score lebih akurat",
        href: "/dashboard/settings",
      },
      {
        id: "cv",
        label: "CV terisi",
        points: 20,
        done: !!cv,
        hint: "Buat atau import CV di CV Generator",
        href: "/dashboard/cv-generator",
      },
      {
        id: "portfolio",
        label: "Minimum 1 portfolio item",
        points: 10,
        done: !!portfolio,
        hint: "Tambah project / karya untuk personal branding",
        href: "/dashboard/portfolio",
      },
      {
        id: "publicEnabled",
        label: "Public profile aktif",
        points: 10,
        done: profile?.publicEnabled === true,
        hint: "Aktifkan public profile sebagai shareable link",
        href: "/dashboard/personal-branding",
      },
      {
        id: "contact",
        label: "LinkedIn / portfolio URL",
        points: 5,
        done:
          (profile?.linkedinUrl ?? "").trim().length > 0 ||
          (profile?.portfolioUrl ?? "").trim().length > 0,
        hint: "Tambah link LinkedIn atau portfolio website",
        href: "/dashboard/settings",
      },
    ];

    const earned = items.filter((i) => i.done).reduce((sum, i) => sum + i.points, 0);
    const max = items.reduce((sum, i) => sum + i.points, 0);
    const score = Math.round((earned / max) * 100);
    const missing = items.filter((i) => !i.done);

    return {
      score,
      earned,
      max,
      done: items.filter((i) => i.done).map(({ id, label, points }) => ({ id, label, points })),
      missing: missing.map(({ id, label, points, hint, href }) => ({ id, label, points, hint, href })),
    };
  },
});

/**
 * Compact user-context snapshot for the AI agent. Aggregates across
 * profile/cv/applications/roadmap/interview tables and returns a
 * newline-separated fact list. Lines are emitted ONLY for fields that
 * are populated — empty/missing data is omitted entirely so the AI
 * never has a chance to invent ("Anda punya 0 lamaran" vs no line).
 *
 * Token budget: ~250 tokens worst case. Caps applied:
 * - skills: top 10
 * - bio: 200 chars
 * - applications: status breakdown only
 * - interviews: count + last topic
 */
export const _getCompactUserContext = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const lines: string[] = [];

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (profile?.fullName?.trim()) lines.push(`Nama: ${profile.fullName.trim()}`);
    if (profile?.location?.trim() && profile.location.trim() !== "—") {
      lines.push(`Lokasi: ${profile.location.trim()}`);
    }
    if (profile?.targetRole?.trim() && profile.targetRole.trim() !== "—") {
      lines.push(`Target role: ${profile.targetRole.trim()}`);
    }
    if (profile?.experienceLevel?.trim()) {
      lines.push(`Level pengalaman: ${profile.experienceLevel.trim()}`);
    }
    if (profile?.skills?.length) {
      const top = profile.skills.slice(0, 10).filter(Boolean).join(", ");
      if (top) lines.push(`Skill utama: ${top}`);
    }
    if (profile?.interests?.length) {
      const top = profile.interests.slice(0, 5).filter(Boolean).join(", ");
      if (top) lines.push(`Minat: ${top}`);
    }
    if (profile?.bio?.trim()) {
      const bio = profile.bio.trim();
      lines.push(`Bio: ${bio.length > 200 ? bio.slice(0, 200) + "…" : bio}`);
    }
    if (profile?.publicEnabled) {
      lines.push(`Personal branding aktif (slug: ${profile.publicSlug ?? "?"})`);
    }
    if (profile?.publicAvailableForHire) {
      lines.push(`Status: open for hire${profile.publicAvailabilityNote ? ` — ${profile.publicAvailabilityNote}` : ""}`);
    }

    const cvs = await ctx.db
      .query("cvs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (cvs.length > 0) {
      const latest = cvs.reduce((a, b) => (a._creationTime > b._creationTime ? a : b));
      const expCount = latest.experience?.length ?? 0;
      lines.push(
        `CV: ${cvs.length} dokumen, terbaru "${latest.title}" (template ${latest.template}, ${expCount} pengalaman)`,
      );
      if (latest.personalInfo?.summary?.trim()) {
        const sum = latest.personalInfo.summary.trim();
        lines.push(`Ringkasan CV: ${sum.length > 160 ? sum.slice(0, 160) + "…" : sum}`);
      }
    }

    const apps = await ctx.db
      .query("jobApplications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (apps.length > 0) {
      const byStatus = new Map<string, number>();
      for (const a of apps) byStatus.set(a.status, (byStatus.get(a.status) ?? 0) + 1);
      const breakdown = Array.from(byStatus.entries())
        .map(([s, c]) => `${c} ${s}`)
        .join(", ");
      lines.push(`Lamaran kerja: ${apps.length} total — ${breakdown}`);
    }

    const roadmaps = await ctx.db
      .query("skillRoadmaps")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (roadmaps.length > 0) {
      const active = roadmaps[0];
      lines.push(
        `Roadmap aktif: "${active.careerPath}" (${Math.round(active.progress ?? 0)}% selesai, ${active.skills?.length ?? 0} skill)`,
      );
    }

    const interviews = await ctx.db
      .query("mockInterviews")
      .withIndex("by_user_started", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
    if (interviews.length > 0) {
      const completed = interviews.filter((i) => i.completedAt).length;
      const last = interviews[0];
      const avgScore =
        interviews.filter((i) => typeof i.overallScore === "number").reduce((a, b) => a + (b.overallScore ?? 0), 0) /
        Math.max(1, interviews.filter((i) => typeof i.overallScore === "number").length);
      lines.push(
        `Mock interview: ${completed} selesai dari ${interviews.length} sesi, terakhir role "${last.role}"${
          Number.isFinite(avgScore) && avgScore > 0 ? `, skor rata-rata ${avgScore.toFixed(1)}/10` : ""
        }`,
      );
    }

    return lines.join("\n");
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
    {
      const items = await ctx.db
        .query("portfolioItems")
        .withIndex("by_user", (q) => q.eq("userId", profile.userId))
        .collect();
      // Per-item brandingShow overrides the global publicPortfolioShow:
      //   undefined → follow global toggle
      //   true      → always show (curate even when global off)
      //   false     → never show
      const visible = items.filter((item) => {
        if (item.brandingShow === true) return true;
        if (item.brandingShow === false) return false;
        return profile.publicPortfolioShow ?? false;
      });
      portfolio = await Promise.all(
        visible.map(async (item) => ({
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
      // Same per-item visibility rule as the explicit-portfolio path.
      const visiblePortfolio = portfolioRows.filter((p) => {
        if (p.brandingShow === true) return true;
        if (p.brandingShow === false) return false;
        return profile.publicPortfolioShow ?? false;
      });
      const portfolioWithUrl: AutoPortfolioItem[] = await Promise.all(
        visiblePortfolio.map(async (p) => ({
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
        showLanguages: stored.showLanguages ?? DEFAULT_AUTO_TOGGLES.showLanguages,
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

    const ctaType = profile.publicCtaType ?? "link";
    const branding = buildBrandingPayload({
      profile: {
        fullName: profile.fullName,
        publicHeadline: profile.publicHeadline ?? "",
        targetRole: profile.publicTargetRoleShow ? profile.targetRole : "",
        location: profile.location ?? "",
        // Bio/skills toggles flow through the toggle override below;
        // we still pass the raw data so the payload-builder can decide.
        bio: profile.bio ?? "",
        skills: profile.skills ?? [],
        avatarUrl,
        contactEmail: profile.publicContactEmail ?? "",
        linkedinUrl: profile.publicLinkedinUrl ?? "",
        portfolioUrl: profile.publicPortfolioUrl ?? "",
      },
      cv: cvDoc,
      portfolio,
      toggles: {
        showExperience:
          profile.publicAutoToggles?.showExperience ??
          DEFAULT_AUTO_TOGGLES.showExperience,
        showEducation:
          profile.publicAutoToggles?.showEducation ??
          DEFAULT_AUTO_TOGGLES.showEducation,
        showCertifications:
          profile.publicAutoToggles?.showCertifications ??
          DEFAULT_AUTO_TOGGLES.showCertifications,
        showProjects:
          profile.publicAutoToggles?.showProjects ??
          DEFAULT_AUTO_TOGGLES.showProjects,
        showLanguages:
          profile.publicAutoToggles?.showLanguages ??
          DEFAULT_AUTO_TOGGLES.showLanguages,
        showBio: Boolean(profile.publicBioShow),
        showSkills: Boolean(profile.publicSkillsShow),
      },
      availability: profile.publicAvailableForHire
        ? {
            open: true,
            note: profile.publicAvailabilityNote ?? "",
          }
        : undefined,
      cta:
        profile.publicCtaLabel && profile.publicCtaUrl
          ? {
              label: profile.publicCtaLabel,
              url: profile.publicCtaUrl,
              type: ctaType,
            }
          : undefined,
      sectionOrder: profile.publicSectionOrder ?? undefined,
      // Style customization (color/font/radius/density) is a manual-
      // only feature — auto users commit to the chosen template's
      // baked-in design language so the result stays cohesive.
      // publicStyle may still exist in the DB from a prior manual
      // session; we just don't surface it when mode === "auto".
      style: mode === "custom" ? (profile.publicStyle ?? undefined) : undefined,
      // Manual-mode blocks fed to the canvas template. Auto-mode pages
      // ignore this field entirely — the v1/v2/v3 hydrators don't read
      // it, and we'd be wasting payload bytes on every public visit.
      blocks: mode === "custom" ? Array.from(blocks) : undefined,
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
      availableForHire: Boolean(profile.publicAvailableForHire),
      availabilityNote: profile.publicAvailabilityNote ?? "",
      ctaLabel: profile.publicCtaLabel ?? "",
      ctaUrl: profile.publicCtaUrl ?? "",
      ctaType: profile.publicCtaType ?? "link",
      sectionOrder: profile.publicSectionOrder ?? [],
      style: profile.publicStyle ?? null,
    };
  },
});
