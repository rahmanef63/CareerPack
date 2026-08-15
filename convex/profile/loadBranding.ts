import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { DEFAULT_AUTO_TOGGLES } from "./autoBlocks";
import { buildBrandingPayload, type BrandingPayload } from "./brandingPayload";

export interface PublicPortfolioItem {
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
}

/**
 * Assemble the branding payload for one profile: avatar + visible portfolio +
 * newest CV, run through `buildBrandingPayload`.
 *
 * Two callers, one implementation on purpose. `getBySlug` serves it to the
 * public page, and `internal.mcp.data.branding.getBrandingData` serves the
 * same bytes to an AI host writing custom HTML against it — if those two ever
 * disagreed, the model would be authoring `data-cp` markers for data the live
 * page does not emit, and the mismatch would only show up as a blank section
 * on a stranger's screen.
 *
 * Reads, in order: avatar URL (only when the toggle is on), portfolioItems by
 * `by_user`, newest `cvs` doc. Costs one `ctx.storage.getUrl` per portfolio
 * cover, which is why the list is resolved exactly once.
 */
export async function loadBranding(
  ctx: QueryCtx,
  profile: Doc<"userProfiles">,
): Promise<{
  avatarUrl: string | null;
  portfolio: PublicPortfolioItem[];
  branding: BrandingPayload;
}> {
  const avatarUrl =
    profile.publicAvatarShow && profile.avatarStorageId
      ? await ctx.storage.getUrl(profile.avatarStorageId)
      : null;

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
  const portfolio: PublicPortfolioItem[] = await Promise.all(
    visible.map(async (item) => ({
      id: item._id as string,
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

  // Newest first: without `.order("desc")` Convex returns the OLDEST doc,
  // which on a fresh account is the seeded demo CV and would override
  // anything imported via Quick Fill.
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
      // Location/bio/skills toggles flow through the toggle override below;
      // we still pass the raw data so the payload builder decides.
      // Location defaults HIDDEN (least-disclosure) — see showLocation.
      location: profile.location ?? "",
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
      // Default hidden until the user opts in (privacy-positive).
      showLocation: Boolean(profile.publicLocationShow),
    },
    availability: profile.publicAvailableForHire
      ? { open: true, note: profile.publicAvailabilityNote ?? "" }
      : undefined,
    cta:
      profile.publicCtaLabel && profile.publicCtaUrl
        ? {
            label: profile.publicCtaLabel,
            url: profile.publicCtaUrl,
            type: profile.publicCtaType ?? "link",
          }
        : undefined,
    sectionOrder: profile.publicSectionOrder ?? undefined,
    // Colour/font/radius/density overrides, surfaced ONLY for a custom
    // document. Nothing writes `publicStyle` any more (the builder's Style
    // card went with it), so the rows that still carry one are leftovers from
    // a manual-mode session — and the hydrator turns it into `!important`
    // overrides on border-radius, spacing and fonts. Emitting it for a
    // template page would restyle two live, indexed profiles on deploy, with
    // no UI left to undo it. HEAD gated this on `mode === "custom"`; the
    // equivalent gate now is "the user brought their own HTML", where the
    // `--cp-*` custom properties are something they can actually use.
    style: profile.publicHtml ? (profile.publicStyle ?? undefined) : undefined,
  });

  return { avatarUrl, portfolio, branding };
}
