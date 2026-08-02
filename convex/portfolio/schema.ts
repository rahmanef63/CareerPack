import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Multi-item media + links + rich metadata so portfolio works for IT,
 * design, writing, speaking, music, etc. Legacy single-cover + single-
 * link fields remain readable; new writes populate the array forms.
 */
export const portfolioMediaValidator = v.object({
  storageId: v.string(),
  kind: v.string(),                  // "image" | "video" | "pdf" | "file"
  caption: v.optional(v.string()),
});

export const portfolioLinkValidator = v.object({
  url: v.string(),
  label: v.string(),
  kind: v.string(),                  // "live" | "repo" | "case-study" | "slides" | "video" | "article" | "store" | "other"
});

export const portfolioTables = {
  portfolioItems: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.string(),

    // Legacy cover — preserved for back-compat reads. New saves
    // populate `media[]` and the server uses media[0] when present.
    coverEmoji: v.optional(v.string()),
    coverGradient: v.optional(v.string()),
    coverStorageId: v.optional(v.string()),

    // Multi-item gallery (images/videos/pdfs). Optional; old rows lack it.
    media: v.optional(v.array(portfolioMediaValidator)),

    // Legacy single link — kept readable.
    link: v.optional(v.string()),

    // Typed multi-link — repo / live / case-study / slides / etc.
    links: v.optional(v.array(portfolioLinkValidator)),

    techStack: v.optional(v.array(v.string())),
    date: v.string(),
    featured: v.boolean(),

    // Rich metadata that any creative discipline can fill.
    role: v.optional(v.string()),
    client: v.optional(v.string()),
    duration: v.optional(v.string()),
    outcomes: v.optional(v.array(v.string())),
    collaborators: v.optional(v.array(v.string())),
    skills: v.optional(v.array(v.string())),

    // Per-item branding visibility — overrides the global
    // `publicPortfolioShow` flag when set. Lets the user curate which
    // items appear on their public page without unsharing the whole list.
    brandingShow: v.optional(v.boolean()),

    // Manual ordering — lower first; falls back to date desc when null.
    sortOrder: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_category", ["userId", "category"])
    .index("by_user_featured", ["userId", "featured"]),
};
