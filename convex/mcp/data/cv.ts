import { internalQuery, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { enforceRateLimit } from "../../_shared/rateLimit";
import { assertShortText } from "../../_shared/validate";
import { MCP_WRITE_LIMIT, MCP_WRITE_DAILY_LIMIT } from "./limits";

/**
 * Data layer for convex/mcp/tools/cv.ts — the worked example every other
 * domain copies.
 *
 * Everything here is `internal*`, and every function takes `userId` as an
 * explicit argument instead of asking the ctx who is calling. That is not
 * style: an MCP request carries no @convex-dev/auth session, so
 * `getAuthUserId(ctx)` is null and `requireUser(ctx)` throws. The httpAction
 * resolves the user from the bearer token once and passes it down.
 *
 * Because the identity arrives as an argument, ownership has to be re-checked
 * against every document — that check is the only thing standing between one
 * user's token and another user's CV.
 */

/** Only the fields worth spending a model's context on. */
function summarise(cv: {
  _id: string;
  _creationTime: number;
  title: string;
  template: string;
  isDefault: boolean;
}) {
  return {
    cv_id: cv._id,
    title: cv.title,
    template: cv.template,
    is_default: cv.isDefault,
    created_at: new Date(cv._creationTime).toISOString(),
  };
}

/**
 * No cursor: `cvs` is bounded per user (a person keeps a handful), and the
 * `by_user` index is what scopes it — never a full-table scan with a filter.
 */
export const listCVs = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const cvs = await ctx.db
      .query("cvs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return { items: cvs.map(summarise), total: cvs.length };
  },
});

export const getCV = internalQuery({
  args: { userId: v.id("users"), cvId: v.id("cvs") },
  handler: async (ctx, args) => {
    const cv = await ctx.db.get(args.cvId);
    // Null rather than a distinct "forbidden": telling the caller apart from
    // "no such id" would confirm which ids exist to anyone who guesses.
    if (!cv || cv.userId !== args.userId) return null;

    const { avatarStorageId: _avatar, ...personal } = cv.personalInfo;
    return {
      ...summarise(cv),
      personal_info: personal,
      experience: cv.experience,
      education: cv.education,
      skills: cv.skills,
      certifications: cv.certifications,
      languages: cv.languages,
      projects: cv.projects,
    };
  },
});

export const setSummary = internalMutation({
  args: {
    userId: v.id("users"),
    cvId: v.id("cvs"),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_LIMIT);
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_DAILY_LIMIT);

    const cv = await ctx.db.get(args.cvId);
    if (!cv || cv.userId !== args.userId) throw new Error("CV tidak ditemukan");

    const summary = assertShortText(args.summary, 2000, "Ringkasan");
    await ctx.db.patch(args.cvId, {
      personalInfo: { ...cv.personalInfo, summary },
    });
    return { cv_id: args.cvId, summary };
  },
});
