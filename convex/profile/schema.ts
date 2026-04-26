import { defineTable } from "convex/server";
import { v } from "convex/values";

export const profileTables = {
  userProfiles: defineTable({
    userId: v.id("users"),
    fullName: v.string(),
    phone: v.optional(v.string()),
    location: v.string(),
    targetRole: v.string(),
    experienceLevel: v.string(),
    bio: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())),
    role: v.optional(
      v.union(v.literal("admin"), v.literal("moderator"), v.literal("user")),
    ),
    email: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
    preferredIndustries: v.optional(v.array(v.string())),

    publicEnabled: v.optional(v.boolean()),
    publicSlug: v.optional(v.string()),
    publicHeadline: v.optional(v.string()),
    publicBioShow: v.optional(v.boolean()),
    publicSkillsShow: v.optional(v.boolean()),
    publicTargetRoleShow: v.optional(v.boolean()),
    publicContactEmail: v.optional(v.string()),
    publicLinkedinUrl: v.optional(v.string()),
    publicPortfolioUrl: v.optional(v.string()),
    publicAllowIndex: v.optional(v.boolean()),
    publicAvatarShow: v.optional(v.boolean()),
    publicPortfolioShow: v.optional(v.boolean()),

    /* ------------------------------------------------------------------
     * Personal Branding builder — block-based content + theme picker.
     * Lets the public page replace Linktree / Bento / generic landings.
     *
     * publicTheme drives layout (linktree=stack, bento=grid, magazine=
     * editorial). publicHeaderBg controls the top hero (gradient preset,
     * solid color, or image URL). publicAccent overrides the brand-link
     * color per profile. publicBlocks is the ordered content stack —
     * heading, paragraph, link, social, image, embed, divider, html.
     *
     * Server validates per block type at write time (see profile/
     * mutations.ts updatePublicBlocks). HTML payload is sanitised by
     * regex strip of dangerous tags + handlers; embed payload is
     * normalised to (provider + id) so the public page never renders
     * user-supplied iframe markup.
     * ------------------------------------------------------------------ */
    /**
     * Otomatis mode rebuilds the public page from the user's existing
     * CV / Profile / Portofolio data via convex/profile/autoBlocks.ts
     * — no manual block authoring required, designed for users
     * without dev skills. Custom mode renders the user-authored
     * `publicBlocks` array. Default = "auto" for new profiles.
     */
    publicMode: v.optional(
      v.union(v.literal("auto"), v.literal("custom")),
    ),
    /**
     * Per-section opt-in for auto mode. Hero-level toggles
     * (publicBioShow / publicSkillsShow / publicAvatarShow / etc) stay
     * where they are — these are extras only auto mode cares about.
     */
    publicAutoToggles: v.optional(
      v.object({
        showExperience: v.optional(v.boolean()),
        showEducation: v.optional(v.boolean()),
        showCertifications: v.optional(v.boolean()),
        showProjects: v.optional(v.boolean()),
        showSocial: v.optional(v.boolean()),
      }),
    ),
    publicTheme: v.optional(
      v.union(
        v.literal("linktree"),
        v.literal("bento"),
        v.literal("magazine"),
        v.literal("template-v1"),
        v.literal("template-v2"),
        v.literal("template-v3"),
      ),
    ),
    publicHeaderBg: v.optional(
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
    publicAccent: v.optional(v.string()),
    /* Share & Export — opt-in flags surfacing the embeddable HTML
     * snippet, iframe embed, and AI-friendly prompt in the builder.
     * Each is independent so the user can keep e.g. the prompt off
     * while sharing the embed publicly. */
    publicHtmlExport: v.optional(v.boolean()),
    publicEmbedExport: v.optional(v.boolean()),
    publicPromptExport: v.optional(v.boolean()),
    publicBlocks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          type: v.string(),
          hidden: v.optional(v.boolean()),
          payload: v.any(),
        }),
      ),
    ),

    avatarStorageId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_public_slug", ["publicSlug"]),
};
