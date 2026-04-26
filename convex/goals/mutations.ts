import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc } from "../_shared/auth";

const MAX_TITLE_LEN = 120;
const MAX_DESC_LEN = 2000;
const MAX_CATEGORY_LEN = 50;
const MAX_MILESTONE_TITLE_LEN = 120;
const MAX_MILESTONES = 20;

function trimLen(field: string, value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) {
    throw new Error(`${field} 1-${max} karakter`);
  }
  return trimmed;
}

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

    const title = trimLen("Judul", args.title, MAX_TITLE_LEN);
    const description = trimLen("Deskripsi", args.description, MAX_DESC_LEN);
    const category = trimLen("Kategori", args.category, MAX_CATEGORY_LEN);

    if (!Number.isFinite(args.targetDate) || args.targetDate <= 0) {
      throw new Error("Tanggal target tidak valid");
    }

    if (args.milestones.length > MAX_MILESTONES) {
      throw new Error(`Maksimal ${MAX_MILESTONES} milestone`);
    }

    const milestones = args.milestones.map((m) => ({
      id: trimLen("ID milestone", m.id, 100),
      title: trimLen("Milestone", m.title, MAX_MILESTONE_TITLE_LEN),
      completed: m.completed,
    }));

    return await ctx.db.insert("careerGoals", {
      userId,
      title,
      description,
      category,
      targetDate: args.targetDate,
      status: "active",
      progress: 0,
      milestones,
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
    const milestoneId = trimLen("ID milestone", args.milestoneId, 100);

    let touched = false;
    const updatedMilestones = goal.milestones.map((milestone) => {
      if (milestone.id === milestoneId) {
        touched = true;
        return {
          ...milestone,
          completed: args.completed,
          completedAt: args.completed ? Date.now() : undefined,
        };
      }
      return milestone;
    });

    if (!touched) throw new Error("Milestone tidak ditemukan");

    const total = updatedMilestones.length;
    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const progress = total === 0 ? 0 : Math.round((completedCount / total) * 100);
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
