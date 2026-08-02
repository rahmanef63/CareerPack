import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireUser } from "../../_shared/auth";
import { sanitizeAIInput } from "../../_shared/sanitize";
import { ALLOWED_ACTION_TYPES } from "./lib";

const actionTypeValidator = v.union(
  ...ALLOWED_ACTION_TYPES.map((t) => v.literal(t)),
) as ReturnType<typeof v.union<[ReturnType<typeof v.literal<(typeof ALLOWED_ACTION_TYPES)[number]>>]>>;

/**
 * Persist a compiled plan as a new active careerQuest. Caller passes
 * the validated `engine.plan.actions.compile` output verbatim — this
 * mutation does not call the LLM, keeping the action/mutation
 * boundary clean.
 */
export const createQuest = mutation({
  args: {
    title: v.string(),
    intent: v.string(),
    etaMonths: v.number(),
    targetNodeSlug: v.optional(v.string()),
    actions: v.array(
      v.object({
        id: v.string(),
        type: actionTypeValidator,
        label: v.string(),
        payload: v.optional(v.any()),
      }),
    ),
  },
  returns: v.id("careerQuests"),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const title = sanitizeAIInput(args.title, 120).trim();
    const intent = sanitizeAIInput(args.intent, 600).trim();
    if (title.length === 0 || intent.length === 0) {
      throw new Error("Judul dan intent wajib diisi");
    }
    if (args.actions.length === 0) {
      throw new Error("Plan butuh minimal satu action");
    }
    // Mirror engine/plan/lib.ts validatePlan bounds — createQuest is a
    // directly-callable mutation that bypasses the compile action's
    // validator, so re-enforce them here to keep junk out of the DB.
    const etaRaw = Number(args.etaMonths);
    const etaMonths = Number.isFinite(etaRaw)
      ? Math.max(1, Math.min(60, Math.round(etaRaw)))
      : 12;
    const actions = args.actions.slice(0, 12);
    const seenIds = new Set<string>();
    for (const a of actions) {
      if (seenIds.has(a.id)) throw new Error("Action id duplikat");
      seenIds.add(a.id);
    }
    return await ctx.db.insert("careerQuests", {
      userId,
      title,
      intent,
      etaMonths,
      targetNodeSlug: args.targetNodeSlug,
      status: "active",
      actions: actions.map((a) => ({
        ...a,
        label: a.label.trim().slice(0, 200),
        completed: false,
      })),
      createdAt: Date.now(),
    });
  },
});

/** Flip a single action's completion state — used by the checklist UI. */
export const toggleAction = mutation({
  args: {
    questId: v.id("careerQuests"),
    actionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const quest = await ctx.db.get(args.questId);
    if (!quest || quest.userId !== userId) {
      throw new Error("Quest tidak ditemukan");
    }
    const nextActions = quest.actions.map((a) =>
      a.id === args.actionId
        ? {
            ...a,
            completed: !a.completed,
            completedAt: !a.completed ? Date.now() : undefined,
          }
        : a,
    );
    await ctx.db.patch(args.questId, { actions: nextActions });
    return null;
  },
});

/** Mark a quest done or abandoned — terminal state, no edits after. */
export const setStatus = mutation({
  args: {
    questId: v.id("careerQuests"),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("abandoned"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const quest = await ctx.db.get(args.questId);
    if (!quest || quest.userId !== userId) {
      throw new Error("Quest tidak ditemukan");
    }
    await ctx.db.patch(args.questId, { status: args.status });
    return null;
  },
});
