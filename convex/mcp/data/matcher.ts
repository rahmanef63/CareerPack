import { internalQuery, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import type { Doc } from "../../_generated/dataModel";
import { enforceRateLimit } from "../../_shared/rateLimit";
import { assertShortText, capStringArray } from "../../_shared/validate";
import { MCP_WRITE_LIMIT, MCP_WRITE_DAILY_LIMIT } from "./limits";

/**
 * Data layer for convex/mcp/tools/matcher.ts. Internal only, `userId` is an
 * argument — see convex/mcp/data/cv.ts.
 *
 * `jobListings` is the one table in this repo with no owner: the feed is
 * public and every signed-in user sees the same rows, so reads here take
 * `userId` only to answer "the ones I pasted" (`addedBy`). `atsScans` is
 * private and gets the usual per-document re-check.
 *
 * The ATS scan itself is an action (AI + quota) and lives in
 * convex/matcher/actions.ts as `_scanCVForUser`; putting a copy here would
 * fork the keyword-extraction pipeline.
 */

const LIST_LIMIT = 50;
/** A listing description runs to a few KB; twenty of them would be most of
 *  the model's window, and the scan reads the full text server-side anyway. */
const DESCRIPTION_PREVIEW = 300;

function summariseJob(j: Doc<"jobListings">) {
  return {
    job_id: j._id,
    title: j.title,
    company: j.company,
    location: j.location,
    work_mode: j.workMode,
    employment_type: j.employmentType,
    seniority: j.seniority,
    category: j.category ?? null,
    salary_min: j.salaryMin ?? null,
    salary_max: j.salaryMax ?? null,
    currency: j.currency ?? null,
    required_skills: j.requiredSkills,
    description_preview: j.description.slice(0, DESCRIPTION_PREVIEW),
    source: j.source ?? "seed",
    apply_url: j.applyUrl ?? null,
    posted_at: new Date(j.postedAt).toISOString(),
  };
}

export const listJobs = internalQuery({
  args: {
    userId: v.id("users"),
    mine: v.optional(v.boolean()),
    workMode: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 15, 1), LIST_LIMIT);

    // "Mine" reads by_addedBy_posted rather than filtering a global window:
    // the app hit exactly that bug, where a user's own pastes disappeared
    // once other people's newer rows filled the window (matcher/queries.ts).
    if (args.mine) {
      const rows = await ctx.db
        .query("jobListings")
        .withIndex("by_addedBy_posted", (q) => q.eq("addedBy", args.userId))
        .order("desc")
        .take(limit);
      return { items: rows.map(summariseJob), total: rows.length };
    }

    const rows =
      args.workMode && args.workMode !== "all"
        ? await ctx.db
            .query("jobListings")
            .withIndex("by_workMode", (q) =>
              q.eq("workMode", args.workMode as string),
            )
            .order("desc")
            .take(limit)
        : await ctx.db
            .query("jobListings")
            .withIndex("by_posted")
            .order("desc")
            .take(limit);
    return { items: rows.map(summariseJob), total: rows.length };
  },
});

export const addJob = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    company: v.string(),
    location: v.string(),
    workMode: v.string(),
    employmentType: v.string(),
    seniority: v.string(),
    description: v.string(),
    requiredSkills: v.array(v.string()),
    category: v.optional(v.string()),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    currency: v.optional(v.string()),
    applyUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_LIMIT);
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_DAILY_LIMIT);

    const title = assertShortText(args.title, 200, "Judul");
    const company = assertShortText(args.company, 200, "Perusahaan");
    if (title.length < 2 || company.length < 1) {
      throw new Error("Judul dan perusahaan wajib diisi.");
    }
    // 40 chars is what matcher.actions.scanCV refuses to score, so a shorter
    // description would store a listing the ATS tool then rejects.
    const description = assertShortText(args.description, 8000, "Deskripsi");
    if (description.length < 40) {
      throw new Error("Deskripsi lowongan minimal 40 karakter.");
    }
    const applyUrl = args.applyUrl?.trim();
    if (applyUrl && !/^https?:\/\//i.test(applyUrl)) {
      throw new Error("Apply URL harus diawali http:// atau https://");
    }

    const jobId = await ctx.db.insert("jobListings", {
      title,
      company,
      location: assertShortText(args.location, 120, "Lokasi") || "—",
      workMode: args.workMode,
      employmentType: args.employmentType,
      seniority: args.seniority,
      salaryMin: args.salaryMin,
      salaryMax: args.salaryMax,
      currency: args.currency,
      description,
      requiredSkills: capStringArray(args.requiredSkills, {
        maxEntries: 30,
        maxLen: 60,
        field: "Skill",
        entryField: "Skill",
      }),
      postedAt: Date.now(),
      applyUrl: applyUrl || undefined,
      source: "user-paste",
      externalId: `user:${args.userId}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`,
      addedBy: args.userId,
      // The app infers this from title keywords; an MCP caller has already
      // read the whole posting, so it just tells us and gets it right.
      category: args.category,
    });
    return { job_id: jobId, title, company };
  },
});

export const listScans = internalQuery({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 10, 1), LIST_LIMIT);
    const rows = await ctx.db
      .query("atsScans")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
    return {
      items: rows.map((s) => ({
        scan_id: s._id,
        cv_id: s.cvId,
        job_id: s.jobListingId ?? null,
        job_title: s.jobTitle,
        job_company: s.jobCompany ?? null,
        score: s.score,
        grade: s.grade,
        created_at: new Date(s.createdAt).toISOString(),
      })),
      total: rows.length,
    };
  },
});

export const getScan = internalQuery({
  args: { userId: v.id("users"), scanId: v.id("atsScans") },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.scanId);
    if (!s || s.userId !== args.userId) return null;
    return {
      scan_id: s._id,
      cv_id: s.cvId,
      job_id: s.jobListingId ?? null,
      job_title: s.jobTitle,
      job_company: s.jobCompany ?? null,
      score: s.score,
      grade: s.grade,
      breakdown: s.breakdown,
      matched_keywords: s.matchedKeywords,
      missing_keywords: s.missingKeywords,
      format_issues: s.formatIssues,
      recommendations: s.recommendations,
      created_at: new Date(s.createdAt).toISOString(),
    };
  },
});
