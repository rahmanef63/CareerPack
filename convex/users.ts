import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const user = await ctx.db.get(userId);
    if (!user) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return { ...user, profile };
  },
});

export const userExistsByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    return !!user;
  },
});

export const createOrUpdateProfile = mutation({
  args: {
    fullName: v.string(),
    phone: v.optional(v.string()),
    location: v.string(),
    targetRole: v.string(),
    experienceLevel: v.string(),
    skills: v.array(v.string()),
    interests: v.array(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const profileData = {
      userId,
      ...args,
    };

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, profileData);
      return existingProfile._id;
    } else {
      return await ctx.db.insert("userProfiles", profileData);
    }
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const [applications, goals, roadmaps, interviews] = await Promise.all([
      ctx.db.query("jobApplications").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("careerGoals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("skillRoadmaps").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("mockInterviews").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);

    const activeGoals = goals.filter(g => g.status === "active").length;
    const completedGoals = goals.filter(g => g.status === "completed").length;
    const avgSkillProgress = roadmaps.length > 0 
      ? roadmaps.reduce((sum, r) => sum + r.progress, 0) / roadmaps.length 
      : 0;
    const recentInterviews = interviews.filter(i => 
      i.completedAt && i.completedAt > Date.now() - 30 * 24 * 60 * 60 * 1000
    ).length;

    return {
      totalApplications: applications.length,
      activeGoals,
      completedGoals,
      avgSkillProgress: Math.round(avgSkillProgress),
      recentInterviews,
      applicationsByStatus: {
        applied: applications.filter(a => a.status === "applied").length,
        screening: applications.filter(a => a.status === "screening").length,
        interview: applications.filter(a => a.status === "interview").length,
        offer: applications.filter(a => a.status === "offer").length,
        rejected: applications.filter(a => a.status === "rejected").length,
      }
    };
  },
});
