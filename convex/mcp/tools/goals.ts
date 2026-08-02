import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { ToolDef } from "../types";

/**
 * MCP tools for the `goals` domain — career goals and their milestones.
 *
 * Read the contract in convex/mcp/tools/index.ts first. The short version:
 * `userId` arrives from the access token, never from `args`, and every
 * `internal.mcp.data.goals.*` function re-checks it against the row.
 */

function requireArg(args: Record<string, unknown>, key: string): string {
  const raw = args[key];
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error(`Parameter ${key} wajib diisi.`);
  }
  return raw;
}

function requireNumber(args: Record<string, unknown>, key: string): number {
  const raw = args[key];
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    throw new Error(`Parameter ${key} harus berupa angka.`);
  }
  return raw;
}

/** Models emit ISO dates; the schema stores epoch ms. Parsing here turns a
 *  silent `NaN` write into a sentence the model can act on. */
function requireDate(args: Record<string, unknown>, key: string): number {
  const ms = Date.parse(requireArg(args, key));
  if (Number.isNaN(ms)) {
    throw new Error(`Parameter ${key} harus tanggal ISO, mis. 2026-12-31.`);
  }
  return ms;
}

export const goalsTools: ToolDef[] = [
  {
    name: "goals_list",
    description:
      "List the user's career goals with their target date, status, percent progress and every milestone. USE THIS FIRST for anything about goals or progress ('what am I working towards', 'am I on track') and to get the goal_id and milestone numbers the other goals_* tools need. Returns all goals; a person keeps a handful, so there is no pagination.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: {
      title: "List career goals",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId) =>
      await ctx.runQuery(internal.mcp.data.goals.listGoals, { userId }),
  },

  {
    name: "goals_create",
    description:
      "Create a career goal with a target date and the milestones that make it up. Break the goal into concrete, checkable steps — milestones are how progress is measured, and a goal with none stays at 0% forever. Write title, description and milestones in the language the user is speaking (usually Indonesian). Progress and status are derived from the milestones, so do not try to set them.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Short name for the goal. Max 120 characters.",
        },
        description: {
          type: "string",
          description: "What reaching it means, and why. Max 2000 characters.",
        },
        category: {
          type: "string",
          description:
            "Free-text grouping the user's own dashboard shows, e.g. 'Karir', 'Skill', 'Finansial'. Max 50 characters.",
        },
        target_date: {
          type: "string",
          description: "Deadline as an ISO date, e.g. 2026-12-31.",
        },
        milestones: {
          type: "array",
          description:
            "Ordered checkable steps, up to 20. Each is one short line; they are referred to later by 1-based position.",
          items: { type: "string" },
        },
      },
      required: ["title", "description", "category", "target_date", "milestones"],
      additionalProperties: false,
    },
    annotations: {
      title: "Create career goal",
      readOnlyHint: false,
      destructiveHint: false,
      // Two calls make two goals; the user would have to delete the extra.
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) => {
      const milestones = args.milestones;
      if (!Array.isArray(milestones)) {
        throw new Error("Parameter milestones harus berupa array.");
      }
      return await ctx.runMutation(internal.mcp.data.goals.createGoal, {
        userId,
        title: requireArg(args, "title"),
        description: requireArg(args, "description"),
        category: requireArg(args, "category"),
        targetDate: requireDate(args, "target_date"),
        milestones: milestones.map((m, i) => {
          if (typeof m !== "string" || m.length === 0) {
            throw new Error(`Milestone ke-${i + 1} harus berupa teks.`);
          }
          return m;
        }),
      });
    },
  },

  {
    name: "goals_set_milestone",
    description:
      "Tick or untick one milestone. This is how a goal advances: the percentage and the active/completed status are recomputed from the milestones, so use it whenever the user says they finished (or has to redo) a step. milestone_number is the 1-based position shown by goals_list. Returns the goal's new progress.",
    inputSchema: {
      type: "object",
      properties: {
        goal_id: { type: "string", description: "Id from goals_list." },
        milestone_number: {
          type: "number",
          description: "1-based position of the milestone within the goal.",
        },
        completed: {
          type: "boolean",
          description: "true to tick it, false to untick.",
        },
      },
      required: ["goal_id", "milestone_number", "completed"],
      additionalProperties: false,
    },
    annotations: {
      title: "Set milestone state",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) => {
      if (typeof args.completed !== "boolean") {
        throw new Error("Parameter completed harus true atau false.");
      }
      return await ctx.runMutation(internal.mcp.data.goals.setMilestone, {
        userId,
        goalId: requireArg(args, "goal_id") as Id<"careerGoals">,
        milestoneNumber: requireNumber(args, "milestone_number"),
        completed: args.completed,
      });
    },
  },

  {
    name: "goals_delete",
    description:
      "Permanently delete one goal and all of its milestones. There is no undo. A goal the user has given up on is usually better left in place — the record of what was attempted is the point — so only call this when they ask for that specific goal to be removed.",
    inputSchema: {
      type: "object",
      properties: {
        goal_id: { type: "string", description: "Id from goals_list." },
      },
      required: ["goal_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Delete career goal",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.mcp.data.goals.deleteGoal, {
        userId,
        goalId: requireArg(args, "goal_id") as Id<"careerGoals">,
      }),
  },
];
