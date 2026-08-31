import { defineTable } from "convex/server";
import { v } from "convex/values";

export const documentsTables = {
  documentChecklists: defineTable({
    userId: v.id("users"),
    type: v.string(),
    country: v.optional(v.string()),
    documents: v.array(v.object({
      id: v.string(),
      name: v.string(),
      /** Only country-template imports carry one — the static Indonesian
       *  list gets its copy from the frontend seed data. */
      description: v.optional(v.string()),
      category: v.string(),
      subcategory: v.optional(v.string()),
      required: v.boolean(),
      completed: v.boolean(),
      notes: v.string(),
      expiryDate: v.optional(v.string()),
    })),
    progress: v.number(),
  }).index("by_user", ["userId"]),

  /**
   * Shared, country-scoped document master list. Seeded from
   * `_seeds/documents/<country>.ts` via the admin Engine Seed panel.
   * Frontend reads per-country to pre-populate a personal checklist.
   */
  documentTemplates: defineTable({
    /** ISO-3166-1 alpha-2, uppercased. "ID" / "JP" / "DE". */
    country: v.string(),
    /** Human-readable label, e.g. "Indonesia". */
    countryLabel: v.string(),
    /** Optional emoji flag. */
    flag: v.optional(v.string()),
    /** Short Indonesian description of the migration / work track. */
    description: v.optional(v.string()),
    documents: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.string(),
        category: v.string(),
        subcategory: v.optional(v.string()),
        required: v.boolean(),
        issuingAuthority: v.optional(v.string()),
        validityYears: v.optional(v.number()),
        notes: v.optional(v.string()),
      }),
    ),
    /** True = seed-managed; false = user/admin custom override. */
    isSystem: v.boolean(),
    /** Official sources this list was checked against — shown to the user
     *  so "info ini didapat dari mana" has a real answer. */
    sources: v.optional(v.array(v.object({ label: v.string(), url: v.string() }))),
    /** ISO date (YYYY-MM-DD) this row's content was last checked against
     *  `sources`. Immigration rules drift often; this is the staleness signal. */
    lastVerified: v.optional(v.string()),
  }).index("by_country", ["country"]),
};
