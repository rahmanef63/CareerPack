import { v } from "convex/values";
import { query, internalQuery } from "../_generated/server";
import { optionalUser } from "../_shared/auth";
import { countryCodeForSlug, countryLabelToSlug } from "./countrySlug";

export const getUserDocumentChecklist = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("documentChecklists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

/**
 * Public — list seeded country document templates for the picker
 * UI. Returns light projection (no full document list) for the
 * grid; full template is fetched lazily by `getTemplateByCountry`.
 */
export const listTemplates = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const rows = await ctx.db.query("documentTemplates").take(50);
    return rows
      .map((r) => ({
        _id: r._id,
        country: r.country,
        countryLabel: r.countryLabel,
        flag: r.flag,
        description: r.description,
        documentCount: r.documents.length,
        requiredCount: r.documents.filter((d) => d.required).length,
        lastVerified: r.lastVerified,
      }))
      .sort((a, b) => a.countryLabel.localeCompare(b.countryLabel));
  },
});

/** Full template payload for a single country — for the preview dialog. */
export const getTemplateByCountry = query({
  args: { country: v.string() },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, { country }) => {
    const row = await ctx.db
      .query("documentTemplates")
      .withIndex("by_country", (q) => q.eq("country", country))
      .first();
    return row;
  },
});

// ---------------------------------------------------------------------------
// Public web (/dokumen, /dokumen/[slug]) — read by Next.js Server Components
// through `ConvexHttpClient` at build time and on every ISR revalidation.
//
// These are deliberately separate from `listTemplates` / `getTemplateByCountry`
// above, which the authenticated dashboard picker calls: the public pages key
// off a human-readable `slug` derived from `countryLabel`, and adding that
// field to the dashboard queries would have coupled two consumers with very
// different churn rates. Both surfaces read the same admin-seeded rows, so
// there is no second source of truth — only a second projection.
//
// `documentTemplates` holds no user data (it is the shared, seeded country
// master list, same as the already-public `listTemplates`), so no guard is
// required. Nothing here reads the session.
// ---------------------------------------------------------------------------

/** Row count cap — mirrors `listTemplates`; there are 15 seeded countries. */
const PUBLIC_TEMPLATE_LIMIT = 50;

/**
 * Index payload for /dokumen. One entry per country, sorted by label so the
 * grid order is stable across builds (an unstable order would churn the
 * static HTML on every revalidation for no reason).
 *
 * `flag` and `description` are optional in the schema but always returned as
 * strings — an empty string renders as nothing, which saves every consumer a
 * null check.
 */
export const listPublicCountryGuides = query({
  args: {},
  returns: v.array(
    v.object({
      slug: v.string(),
      country: v.string(),
      countryLabel: v.string(),
      flag: v.string(),
      description: v.string(),
      documentCount: v.number(),
      requiredCount: v.number(),
      lastVerified: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const rows = await ctx.db.query("documentTemplates").take(PUBLIC_TEMPLATE_LIMIT);
    return rows
      .map((r) => ({
        slug: countryLabelToSlug(r.countryLabel),
        country: r.country,
        countryLabel: r.countryLabel,
        flag: r.flag ?? "",
        description: r.description ?? "",
        documentCount: r.documents.length,
        requiredCount: r.documents.filter((d) => d.required).length,
        lastVerified: r.lastVerified ?? "",
      }))
      .sort((a, b) => a.countryLabel.localeCompare(b.countryLabel));
  },
});

/**
 * Full guide for /dokumen/[slug]. Returns the whole `documentTemplates` row
 * plus the derived `slug`, or null for an unknown slug — the page turns that
 * into `notFound()`.
 *
 * Resolution is two-tier. The seeded slugs map straight to an ISO code and hit
 * the `by_country` index. Anything else falls back to a bounded scan matching
 * the derived slug, so an admin-authored custom template gets a working public
 * URL without a code change. The scan is 15 rows today and capped at 50.
 */
export const getPublicCountryGuide = query({
  args: { slug: v.string() },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, { slug }) => {
    const normalized = countryLabelToSlug(slug);
    if (!normalized) return null;

    const code = countryCodeForSlug(normalized);
    if (code) {
      const row = await ctx.db
        .query("documentTemplates")
        .withIndex("by_country", (q) => q.eq("country", code))
        .first();
      if (row) return { ...row, slug: countryLabelToSlug(row.countryLabel) };
    }

    const rows = await ctx.db.query("documentTemplates").take(PUBLIC_TEMPLATE_LIMIT);
    const match = rows.find((r) => countryLabelToSlug(r.countryLabel) === normalized);
    return match ? { ...match, slug: normalized } : null;
  },
});

// ---------------------------------------------------------------------------
// MCP (convex/mcp/tools/documents.ts). `optionalUser` returns null in an MCP
// request — no @convex-dev/auth session — so the user id arrives as an
// explicit arg resolved from the bearer token.
// ---------------------------------------------------------------------------

export const mcpGetChecklist = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const checklist = await ctx.db
      .query("documentChecklists")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!checklist) return null;
    return {
      country: checklist.country ?? null,
      type: checklist.type,
      progress: checklist.progress,
      // `document_id` is the template-scoped string key, not a Convex row id
      // — it is what documents_set_status takes.
      items: checklist.documents.map((d) => ({
        document_id: d.id,
        name: d.name,
        category: d.category,
        subcategory: d.subcategory ?? null,
        required: d.required,
        completed: d.completed,
        notes: d.notes,
        expiry_date: d.expiryDate ?? null,
      })),
    };
  },
});

/**
 * No `userId`: `documentTemplates` is the shared, admin-seeded country
 * master list, not user data. The MCP handler still runs behind a resolved
 * bearer, so this is not reachable unauthenticated.
 */
export const mcpListCountryTemplates = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("documentTemplates").take(50);
    return {
      items: rows
        .map((r) => ({
          country: r.country,
          label: r.countryLabel,
          description: r.description ?? null,
          document_count: r.documents.length,
          required_count: r.documents.filter((d) => d.required).length,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    };
  },
});
