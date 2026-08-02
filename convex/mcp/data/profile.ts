import { internalQuery } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Read side for convex/mcp/tools/profile.ts. The write side is
 * `internal.profile.mutations._patchProfileFor`, which sits next to the
 * module-private `validateProfileFields` — the caps on these fields already
 * carry a comment about never drifting between write paths, and a third copy
 * here would be exactly that drift.
 *
 * Omitted on purpose: `email`, `phone`, `ipCountry`, `avatarStorageId`.
 * They are the user's own, but a career assistant never needs a phone number
 * to do its job, and everything a tool returns is copied into a third
 * party's transcript. `role` is omitted too — it is an authorization fact,
 * not profile content.
 */
export const getProfile = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const p = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!p) return null;
    return {
      full_name: p.fullName,
      location: p.location,
      target_role: p.targetRole,
      experience_level: p.experienceLevel,
      bio: p.bio ?? null,
      skills: p.skills ?? [],
      interests: p.interests ?? [],
      preferred_industries: p.preferredIndustries ?? [],
      linkedin_url: p.linkedinUrl ?? null,
      portfolio_url: p.portfolioUrl ?? null,
      // The public page is served from the app root by slug
      // (frontend/app/[slug]/page.tsx), so the slug alone is the whole link.
      public_page_enabled: p.publicEnabled === true,
      public_page_url:
        p.publicEnabled === true && p.publicSlug
          ? `https://careerpack.org/${p.publicSlug}`
          : null,
      weekly_digest_enabled: p.digestEnabled === true,
    };
  },
});
