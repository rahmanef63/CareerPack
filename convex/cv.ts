import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { optionalUser, requireUser, requireOwnedDoc } from "./_lib/auth";

export const getUserCVs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("cvs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

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
    await ctx.db.delete(args.cvId);
  },
});
