import { mutation, internalMutation, type MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc } from "../_shared/auth";
import { enforceRateLimit, AI_RATE_LIMITS } from "../_shared/rateLimit";
import type { Id } from "../_generated/dataModel";

/**
 * Cascade FK references when a CV is deleted. `atsScans.cvId` is a
 * REQUIRED FK so the row would be unreadable if left dangling — must
 * delete. `jobApplications.cvId` is optional, so we just unset it
 * (preserves the application record + its history).
 */
async function cascadeRemoveCV(
  ctx: MutationCtx,
  userId: Id<"users">,
  cvId: Id<"cvs">,
) {
  const scans = await ctx.db
    .query("atsScans")
    .withIndex("by_user_cv", (q) => q.eq("userId", userId).eq("cvId", cvId))
    .collect();
  for (const s of scans) await ctx.db.delete(s._id);

  const apps = await ctx.db
    .query("jobApplications")
    .withIndex("by_user_cv", (q) => q.eq("userId", userId).eq("cvId", cvId))
    .collect();
  for (const a of apps) await ctx.db.patch(a._id, { cvId: undefined });
}

export const createCV = mutation({
  args: {
    title: v.string(),
    template: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const user = await ctx.db.get(userId);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return await ctx.db.insert("cvs", {
      userId,
      title: args.title,
      template: args.template,
      personalInfo: {
        fullName: profile?.fullName || user?.name || "",
        email: user?.email || "",
        phone: profile?.phone || "",
        location: profile?.location || "",
        summary: profile?.bio || "",
      },
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      languages: [],
      projects: [],
      isDefault: false,
    });
  },
});

export const updateCV = mutation({
  args: {
    cvId: v.id("cvs"),
    updates: v.object({
      title: v.optional(v.string()),
      personalInfo: v.optional(v.object({
        fullName: v.string(),
        email: v.string(),
        phone: v.string(),
        location: v.string(),
        linkedin: v.optional(v.string()),
        portfolio: v.optional(v.string()),
        summary: v.string(),
        avatarStorageId: v.optional(v.string()),
        dateOfBirth: v.optional(v.string()),
      })),
      displayPrefs: v.optional(v.object({
        showPicture: v.optional(v.boolean()),
        showAge: v.optional(v.boolean()),
        showGraduationYear: v.optional(v.boolean()),
        templateId: v.optional(v.string()),
      })),
      experience: v.optional(v.array(v.object({
        id: v.string(),
        company: v.string(),
        position: v.string(),
        startDate: v.string(),
        endDate: v.optional(v.string()),
        current: v.boolean(),
        description: v.string(),
        achievements: v.array(v.string()),
      }))),
      education: v.optional(v.array(v.object({
        id: v.string(),
        institution: v.string(),
        degree: v.string(),
        field: v.string(),
        startDate: v.string(),
        endDate: v.string(),
        gpa: v.optional(v.string()),
      }))),
      skills: v.optional(v.array(v.object({
        id: v.string(),
        name: v.string(),
        category: v.string(),
        proficiency: v.number(),
      }))),
      certifications: v.optional(v.array(v.object({
        id: v.string(),
        name: v.string(),
        issuer: v.string(),
        date: v.string(),
        expiryDate: v.optional(v.string()),
      }))),
      languages: v.optional(v.array(v.object({
        language: v.string(),
        proficiency: v.string(),
      }))),
      projects: v.optional(v.array(v.object({
        id: v.string(),
        name: v.string(),
        description: v.string(),
        technologies: v.array(v.string()),
        link: v.optional(v.string()),
      }))),
    }),
  },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.cvId, "CV");
    await ctx.db.patch(args.cvId, args.updates);
    return args.cvId;
  },
});

export const deleteCV = mutation({
  args: { cvId: v.id("cvs") },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.cvId, "CV");
    const userId = await requireUser(ctx);
    await cascadeRemoveCV(ctx, userId, args.cvId);
    await ctx.db.delete(args.cvId);
  },
});

/**
 * Bulk delete with FK cascade — can't use the generic
 * `makeBulkDelete` factory because we need to clean up atsScans +
 * jobApplications.cvId per id before the row goes away.
 */
export const bulkDeleteCVs = mutation({
  args: { ids: v.array(v.id("cvs")) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    let deleted = 0;
    for (const id of args.ids) {
      await requireOwnedDoc(ctx, id, "CV");
      await cascadeRemoveCV(ctx, userId, id);
      await ctx.db.delete(id);
      deleted++;
    }
    return { deleted };
  },
});

// Quota check used by cv/actions.ts translate(). Called from action via
// internal.cv.mutations._checkTranslateQuota.
export const _checkTranslateQuota = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await enforceRateLimit(ctx, userId, AI_RATE_LIMITS["ai:minute"]);
    await enforceRateLimit(ctx, userId, AI_RATE_LIMITS["ai:day"]);
  },
});
