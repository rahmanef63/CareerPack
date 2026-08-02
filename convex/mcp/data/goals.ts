import { internalQuery, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { enforceRateLimit } from "../../_shared/rateLimit";
import { assertShortText } from "../../_shared/validate";
import { MCP_WRITE_LIMIT, MCP_WRITE_DAILY_LIMIT } from "./limits";

/**
 * Data layer for convex/mcp/tools/goals.ts. Internal only, `userId` is an
 * argument and is re-checked against every document — see
 * convex/mcp/data/cv.ts for the reasoning.
 *
 * Milestones are addressed by 1-BASED POSITION for the same reason questions
 * are in mockInterview: goals created in the web app carry client-generated
 * milestone ids the model never sees.
 */

const MAX_MILESTONES = 20;

export const listGoals = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("careerGoals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return {
      items: rows.map((g) => ({
        goal_id: g._id,
        title: g.title,
        description: g.description,
        category: g.category,
        status: g.status,
        progress: g.progress,
        target_date: new Date(g.targetDate).toISOString().slice(0, 10),
        milestones: g.milestones.map((m, i) => ({
          number: i + 1,
          title: m.title,
          completed: m.completed,
        })),
      })),
      total: rows.length,
    };
  },
});

export const createGoal = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    targetDate: v.number(),
    milestones: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_LIMIT);
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_DAILY_LIMIT);

    if (!Number.isFinite(args.targetDate) || args.targetDate <= 0) {
      throw new Error("Tanggal target tidak valid");
    }
    if (args.milestones.length > MAX_MILESTONES) {
      throw new Error(`Maksimal ${MAX_MILESTONES} milestone`);
    }

    const goalId = await ctx.db.insert("careerGoals", {
      userId: args.userId,
      title: assertShortText(args.title, 120, "Judul"),
      description: assertShortText(args.description, 2000, "Deskripsi"),
      category: assertShortText(args.category, 50, "Kategori"),
      targetDate: args.targetDate,
      status: "active",
      progress: 0,
      milestones: args.milestones.map((title, i) => ({
        id: String(i + 1),
        title: assertShortText(title, 120, "Milestone"),
        completed: false,
      })),
    });
    return { goal_id: goalId, milestone_count: args.milestones.length };
  },
});

export const setMilestone = internalMutation({
  args: {
    userId: v.id("users"),
    goalId: v.id("careerGoals"),
    milestoneNumber: v.number(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_LIMIT);
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_DAILY_LIMIT);

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== args.userId) {
      throw new Error("Goal tidak ditemukan");
    }

    const idx = args.milestoneNumber - 1;
    if (!Number.isInteger(idx) || idx < 0 || idx >= goal.milestones.length) {
      throw new Error(`Nomor milestone harus 1-${goal.milestones.length}`);
    }

    const milestones = goal.milestones.slice();
    milestones[idx] = {
      ...milestones[idx],
      completed: args.completed,
      completedAt: args.completed ? Date.now() : undefined,
    };

    // Same derivation as goals/mutations.updateGoalProgress — progress and
    // status are never client-supplied, so the two write paths cannot
    // disagree about what "80% done" means.
    const done = milestones.filter((m) => m.completed).length;
    const progress =
      milestones.length === 0 ? 0 : Math.round((done / milestones.length) * 100);

    await ctx.db.patch(args.goalId, {
      milestones,
      progress,
      status: progress === 100 ? "completed" : "active",
    });
    return { goal_id: args.goalId, progress };
  },
});

export const deleteGoal = internalMutation({
  args: { userId: v.id("users"), goalId: v.id("careerGoals") },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_LIMIT);
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_DAILY_LIMIT);

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== args.userId) {
      throw new Error("Goal tidak ditemukan");
    }
    await ctx.db.delete(args.goalId);
    return { deleted: true };
  },
});
