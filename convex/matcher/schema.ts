import { defineTable } from "convex/server";
import { v } from "convex/values";

export const matcherTables = {
  jobListings: defineTable({
    title: v.string(),
    company: v.string(),
    location: v.string(),
    workMode: v.string(),
    employmentType: v.string(),
    seniority: v.string(),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    currency: v.optional(v.string()),
    description: v.string(),
    requiredSkills: v.array(v.string()),
    postedAt: v.number(),
    applyUrl: v.optional(v.string()),
    companyLogo: v.optional(v.string()),
    /** AI-extracted keyword cache. Populated lazily by the ATS scan
     *  action (`api.matcher.actions.extractKeywords`). Re-extraction
     *  happens when `extractedKeywordsAt` is older than the row's
     *  `_creationTime` (i.e. the listing was edited) — but description
     *  changes rarely so this is essentially a one-shot per listing. */
    extractedKeywords: v.optional(v.array(v.string())),
    extractedKeywordsAt: v.optional(v.number()),
  })
    .index("by_posted", ["postedAt"])
    .index("by_workMode", ["workMode", "postedAt"]),

  /** History of ATS scans. Captures the FULL result (score breakdown,
   *  matched + missing keywords, format issues, recommendations) so the
   *  user can see progress over time without re-running the AI call.
   *
   *  Linked to `cvs` (cvId) and optionally a `jobListings` row when the
   *  scan was triggered from a listing. `rawJobText` snapshots the JD
   *  content used at scan time so re-opening the scan shows the same
   *  context even if the underlying listing was later edited. */
  atsScans: defineTable({
    userId: v.id("users"),
    cvId: v.id("cvs"),
    jobListingId: v.optional(v.id("jobListings")),
    jobTitle: v.string(),
    jobCompany: v.optional(v.string()),
    rawJobText: v.string(),
    score: v.number(),
    grade: v.string(),
    breakdown: v.object({
      keywordCoverage: v.number(),
      hardSkills: v.number(),
      experienceFit: v.number(),
      sectionCompleteness: v.number(),
      parseability: v.number(),
    }),
    matchedKeywords: v.array(v.string()),
    missingKeywords: v.array(v.string()),
    formatIssues: v.array(v.string()),
    recommendations: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_cv", ["userId", "cvId"])
    .index("by_user_listing", ["userId", "jobListingId"]),
};
