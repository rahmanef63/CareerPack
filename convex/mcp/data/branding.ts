import { internalQuery, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { enforceRateLimit } from "../../_shared/rateLimit";
import { loadBranding } from "../../profile/loadBranding";
import {
  PUBLIC_HTML_MAX,
  normalizePublicHtml,
} from "../../profile/publicHtml";
import { MCP_WRITE_LIMIT, MCP_WRITE_DAILY_LIMIT } from "./limits";

/**
 * Read/write side for convex/mcp/tools/branding.ts — the public personal-brand
 * page.
 *
 * What an MCP client CAN do here: read the page's settings, read the exact
 * data payload the page hydrates from, and replace or clear the page's HTML.
 *
 * What it CANNOT do, on purpose: publish. `publicEnabled`, `publicSlug` and
 * `publicAllowIndex` are writable only from the dashboard, where the user can
 * see what they are putting on the internet under their own name. An AI host
 * can compose the page; deciding it goes live stays with the human.
 */

async function findProfile(ctx: QueryCtx, userId: Id<"users">) {
  return await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
}

/** An MCP token outlives any browser tab and drives writes unattended. */
async function mcpQuota(ctx: MutationCtx, userId: Id<"users">) {
  await enforceRateLimit(ctx, userId, MCP_WRITE_LIMIT);
  await enforceRateLimit(ctx, userId, MCP_WRITE_DAILY_LIMIT);
}

/**
 * Page settings + whether custom HTML is in play. `include_html` is opt-in
 * because a page can be a quarter of a megabyte and the model rarely needs to
 * re-read what it just wrote.
 */
export const getBranding = internalQuery({
  args: { userId: v.id("users"), includeHtml: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const p = await findProfile(ctx, args.userId);
    if (!p) return null;
    const html = p.publicHtml ?? "";
    return {
      published: p.publicEnabled === true,
      slug: p.publicSlug ?? null,
      url:
        p.publicEnabled === true && p.publicSlug
          ? `https://careerpack.org/${p.publicSlug}`
          : null,
      headline: p.publicHeadline ?? "",
      indexable: p.publicAllowIndex === true,
      // Which built-in template renders when there is no custom HTML.
      template: p.publicTheme ?? "template-v2",
      source: html ? ("custom_html" as const) : ("template" as const),
      html_chars: html.length,
      html_max_chars: PUBLIC_HTML_MAX,
      html: args.includeHtml ? html : undefined,
    };
  },
});

/**
 * The live `__cp_data` payload — byte-identical to what the public page
 * hydrates from, because both go through `loadBranding`. This is what makes
 * AI-authored HTML dynamic instead of a snapshot: the model writes markers
 * against these keys, and the page fills them from the CV / portfolio /
 * profile at request time, forever after.
 */
export const getBrandingData = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const p = await findProfile(ctx, args.userId);
    if (!p) return null;
    const { branding } = await loadBranding(ctx, p);
    // Same rule as every other tool here: no storage URLs in a third party's
    // transcript. `ctx.storage.getUrl` hands back a permanent unauthenticated
    // link — for a page that may not even be published — and the model has no
    // use for it anyway. It only needs to know the slot has something, so the
    // markup keeps the <img>. Booleans carry that.
    return {
      ...branding,
      identity: {
        ...branding.identity,
        avatarUrl: branding.identity.avatarUrl ? "[avatar]" : null,
      },
      projects: branding.projects.map((proj) => ({
        ...proj,
        coverUrl: proj.coverUrl ? "[cover]" : null,
      })),
    };
  },
});

export const setHtml = internalMutation({
  args: { userId: v.id("users"), html: v.string() },
  handler: async (ctx, args) => {
    await mcpQuota(ctx, args.userId);
    const p = await findProfile(ctx, args.userId);
    if (!p) {
      throw new Error("Profil belum dibuat — lengkapi profil dulu di aplikasi");
    }
    const html = normalizePublicHtml(args.html);
    if (!html) throw new Error("HTML kosong — kirim dokumen HTML lengkap");
    await ctx.db.patch(p._id, { publicHtml: html });
    return {
      ok: true as const,
      html_chars: html.length,
      published: p.publicEnabled === true,
      url:
        p.publicEnabled === true && p.publicSlug
          ? `https://careerpack.org/${p.publicSlug}`
          : null,
    };
  },
});

export const clearHtml = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await mcpQuota(ctx, args.userId);
    const p = await findProfile(ctx, args.userId);
    if (!p) {
      throw new Error("Profil belum dibuat — lengkapi profil dulu di aplikasi");
    }
    const had = Boolean(p.publicHtml);
    await ctx.db.patch(p._id, { publicHtml: undefined });
    return {
      ok: true as const,
      removed: had,
      template: p.publicTheme ?? "template-v2",
    };
  },
});
