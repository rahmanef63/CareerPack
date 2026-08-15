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
    // Least-disclosure: location is only emitted into the public branding
    // payload when this is explicitly true (default = hidden), mirroring
    // every sibling public field. Existing profiles' locations stay hidden
    // until the user opts in.
    publicLocationShow: v.optional(v.boolean()),
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
     * LEGACY — read-only since the block builder was removed (2026-08-15).
     * The page is always built from live CV / Profile / Portofolio data now;
     * "custom" no longer changes anything at render time. Kept in the
     * validator so existing rows still pass schema validation. Nothing
     * writes it.
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
        showLanguages: v.optional(v.boolean()),
      }),
    ),
    /**
     * "Available for hire" badge — surfaces an at-a-glance status near
     * the hero on the public page. Note is short-form (≤80 chars):
     * e.g. "Open for senior frontend roles · Q3 2026".
     */
    publicAvailableForHire: v.optional(v.boolean()),
    publicAvailabilityNote: v.optional(v.string()),
    /**
     * Primary call-to-action button rendered in the hero. Type is a
     * semantic hint so the hydrator can pick the right icon and the
     * UI can validate URL shape (mailto: vs http vs calendly).
     */
    publicCtaLabel: v.optional(v.string()),
    publicCtaUrl: v.optional(v.string()),
    publicCtaType: v.optional(
      v.union(
        v.literal("link"),
        v.literal("email"),
        v.literal("calendly"),
        v.literal("download"),
      ),
    ),
    /**
     * User-controlled order of branding sections on the public page.
     * Hydrator reorders DOM nodes carrying `data-cp-section` markers
     * to match this list. Sections not in the list keep their
     * template-default order. Empty/null = template default.
     */
    publicSectionOrder: v.optional(v.array(v.string())),
    publicTheme: v.optional(
      v.union(
        v.literal("linktree"),
        v.literal("bento"),
        v.literal("magazine"),
        v.literal("template-v1"),
        v.literal("template-v2"),
        v.literal("template-v3"),
        v.literal("starter"),
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
    /**
     * Manual-mode "Style" customization — sits on top of the chosen
     * template (publicTheme) and the iframe hydrator turns it into
     * CSS custom properties on `documentElement` so the live page
     * picks up the user's primary color, font family, border radius
     * and spacing density. Optional — undefined falls back to the
     * template's baked defaults.
     */
    publicStyle: v.optional(
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
    /* Share & Export — opt-in flags surfacing the embeddable HTML
     * snippet, iframe embed, and AI-friendly prompt in the builder.
     * Each is independent so the user can keep e.g. the prompt off
     * while sharing the embed publicly. */
    publicHtmlExport: v.optional(v.boolean()),
    publicEmbedExport: v.optional(v.boolean()),
    publicPromptExport: v.optional(v.boolean()),
    /**
     * Custom page HTML — a complete standalone document that REPLACES the
     * built-in template when set. Authored by the user or, more usually, by
     * an AI host over MCP (`branding_set_html`), which is why the whole
     * block builder could go: one HTML string covers every layout a block
     * tree could express and a lot it could not.
     *
     * It is NOT static: the renderer splices the same `__cp_data` payload +
     * hydrator into it as into a built-in template, so `data-cp` markers in
     * this HTML keep filling from the live CV / portfolio / profile data.
     * See frontend/slices/personal-branding/themes/templateHydrator.ts for
     * the marker contract.
     *
     * Not sanitised, by design: it is rendered inside the same sandboxed
     * srcdoc iframe as the built-in templates (no `allow-same-origin`), so
     * its scripts run in an opaque origin and cannot reach the app's origin,
     * cookies, or Convex session. Size is capped at PUBLIC_HTML_MAX.
     */
    publicHtml: v.optional(v.string()),
    /** LEGACY — see `publicMode`. Read-only leftovers of the block builder. */
    publicBlocks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          type: v.string(),
          hidden: v.optional(v.boolean()),
          payload: v.any(),
          /** Optional chrome applied uniformly to every block type
           *  (bgVariant / padding / textAlign). Loose `v.any()`
           *  validation — the server-side sanitiser whitelists. */
          style: v.optional(v.any()),
        }),
      ),
    ),

    avatarStorageId: v.optional(v.string()),

    /**
     * Weekly job digest opt-in. When enabled, the Monday cron sends
     * a personalised email with top matches from the matcher. Default
     * = undefined = NOT enrolled (opt-in, never opt-out — Indonesian
     * inbox spam fatigue is real). lastDigestSentAt prevents double-
     * sends if a cron retries.
     */
    digestEnabled: v.optional(v.boolean()),
    lastDigestSentAt: v.optional(v.number()),

    /**
     * Heartbeat last-active timestamp. Updated by `profile.mutations.heartbeat`
     * from the client at most every 5 min when the app is in foreground.
     * Surfaced in `admin.queries.listAllUsers` so the admin can see who
     * is active in the last 24h / 7d. Optional + additive — defaults to
     * undefined for legacy rows.
     */
    lastActiveAt: v.optional(v.number()),

    /**
     * ISO-3166-1 alpha-2 country the account was last seen connecting
     * from. COUNTRY ONLY — the raw IP is personal data, this repo is
     * public, and an admin table is not a reason to start retaining
     * addresses; the address is resolved and discarded by the caller
     * (same deal as the `pageviews` beacon).
     *
     * Written by `internal.admin.mutations.recordUserCountry`, which only
     * an httpAction can call — Convex mutations never see request headers,
     * so there is no IP at signup/login time inside a mutation. That means
     * existing rows can never be backfilled and stay undefined until the
     * account hits a geo-aware httpAction; `admin.queries.listUsersWithProfiles`
     * therefore renders "—" instead of falling back to `location`, which is
     * user-typed free text and an unrelated signal.
     */
    ipCountry: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_public_slug", ["publicSlug"])
    /**
     * Lets `admin/mutations.ts` count admins (the "are you the only
     * admin left?" check) without scanning every profile row. Replaces
     * three `.collect()` calls in updateUserRole / deleteUser /
     * bulkDeleteUsers — O(users) → O(admins).
     */
    .index("by_role", ["role"])
    /**
     * Weekly-digest sweep — lets `notifications/digest._listOptedIn`
     * page just the opted-in profiles instead of scanning every row.
     */
    .index("by_digest", ["digestEnabled", "lastDigestSentAt"])
    /**
     * Public sitemap — `profile/queries.listIndexableSlugs` is
     * unauthenticated and used by /sitemap.xml; without this it had to
     * `.collect()` every profile (including private fields) to pick out
     * a handful of slugs.
     */
    .index("by_public_index", ["publicEnabled", "publicAllowIndex", "publicSlug"]),
};
