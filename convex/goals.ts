import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { optionalUser, requireUser, requireOwnedDoc } from "./_lib/auth";

export const getUserGoals = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("careerGoals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const createGoal = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    targetDate: v.number(),
    milestones: v.array(v.object({
      id: v.string(),
      title: v.string(),
      completed: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await ctx.db.insert("careerGoals", {
      userId,
      title: args.title,
      description: args.description,
      category: args.category,
      targetDate: args.targetDate,
      status: "active",
      progress: 0,
      milestones: args.milestones,
    });
  },
});

export const updateGoalProgress = mutation({
  args: {
    goalId: v.id("careerGoals"),
    milestoneId: v.string(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const goal = await requireOwnedDoc(ctx, args.goalId, "Goal");

    const updatedMilestones = goal.milestones.map((milestone) => {
      if (milestone.id === args.milestoneId) {
        return {
          ...milestone,
          completed: args.completed,
          completedAt: args.completed ? Date.now() : undefined,
        };
      }
      return milestone;
    });

    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const progress = Math.round((completedCount / updatedMilestones.length) * 100);
    const status = progress === 100 ? "completed" : "active";

    await ctx.db.patch(args.goalId, {
      milestones: updatedMilestones,
      progress,
      status,
    });
  },
});

export const deleteGoal = mutation({
  args: { goalId: v.id("careerGoals") },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.goalId, "Goal");
    await ctx.db.delete(args.goalId);
  },
});
