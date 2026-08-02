import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { ToolDef } from "../types";
import { BUDGET_ICONS } from "../data/financial";

/**
 * MCP tools for the `financial` domain — monthly budget envelopes, plus a
 * read of the relocation/salary plan.
 *
 * Read the contract in convex/mcp/tools/index.ts first. The short version:
 * `userId` arrives from the access token, never from `args`, and every
 * `internal.mcp.data.financial.*` function re-checks it against the row.
 *
 * There is no tool that WRITES the financial plan. Its readiness score is
 * derived from fifteen coupled numbers by financial/mutations.ts, and the
 * only way to expose a write here is to fork that arithmetic — two
 * implementations of "are you ready to move abroad" is worse than one that
 * only the app's own calculator can set.
 */

function requireArg(args: Record<string, unknown>, key: string): string {
  const raw = args[key];
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error(`Parameter ${key} wajib diisi.`);
  }
  return raw;
}

function optionalArg(
  args: Record<string, unknown>,
  key: string,
): string | undefined {
  const raw = args[key];
  return typeof raw === "string" && raw.length > 0 ? raw : undefined;
}

function requireNumber(args: Record<string, unknown>, key: string): number {
  const raw = args[key];
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    throw new Error(`Parameter ${key} harus berupa angka.`);
  }
  return raw;
}

function optionalNumber(
  args: Record<string, unknown>,
  key: string,
): number | undefined {
  const raw = args[key];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
}

function requireKind(args: Record<string, unknown>): "expense" | "savings" {
  const raw = args.kind;
  if (raw !== "expense" && raw !== "savings") {
    throw new Error("Parameter kind harus 'expense' atau 'savings'.");
  }
  return raw;
}

export const financialTools: ToolDef[] = [
  {
    name: "budget_list",
    description:
      "List the user's monthly budget lines — every expense and savings envelope with its amount — plus the totals for each kind. USE THIS FIRST for any money question ('how much do I spend a month', 'can I afford X') and to get the budget_id the other budget_* tools need. Amounts are monthly and in Indonesian rupiah.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: {
      title: "List budget lines",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId) =>
      await ctx.runQuery(internal.mcp.data.financial.listBudget, { userId }),
  },

  {
    name: "budget_add",
    description:
      "Add one monthly budget line, e.g. the user says 'tambah cicilan motor 800rb'. Read budget_list first and update the existing line instead if one already covers this — duplicates quietly double the totals the user plans against. value is a whole number of rupiah per MONTH (800rb → 800000, 1,2jt → 1200000); convert any 'per year' or 'per week' figure yourself. kind splits the two totals: money going out is 'expense', money set aside is 'savings'.",
    inputSchema: {
      type: "object",
      properties: {
        label: {
          type: "string",
          description:
            "What this line is, in the user's own words. Max 40 characters.",
        },
        value: {
          type: "number",
          description: "Rupiah per month, whole number, max 1000000000.",
        },
        kind: {
          type: "string",
          enum: ["expense", "savings"],
          description: "'expense' for spending, 'savings' for money put aside.",
        },
        icon: {
          type: "string",
          enum: [...BUDGET_ICONS],
          description:
            "Icon shown next to the line. Pick the closest fit; defaults to Wallet.",
        },
        color: {
          type: "string",
          description:
            "Chart colour as #rrggbb hex. Defaults to a neutral slate grey.",
        },
      },
      required: ["label", "value", "kind"],
      additionalProperties: false,
    },
    annotations: {
      title: "Add budget line",
      readOnlyHint: false,
      destructiveHint: false,
      // Two calls make two lines and silently double that part of the budget.
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.mcp.data.financial.addBudget, {
        userId,
        label: requireArg(args, "label"),
        value: requireNumber(args, "value"),
        kind: requireKind(args),
        icon: optionalArg(args, "icon"),
        color: optionalArg(args, "color"),
      }),
  },

  {
    name: "budget_update",
    description:
      "Change one existing budget line — the tool for 'naikkan cicilan jadi 1jt' or 'ganti label X jadi Y'. Send only the fields that change; anything omitted is left alone. value replaces the old amount, it is not added to it. Needs a budget_id from budget_list.",
    inputSchema: {
      type: "object",
      properties: {
        budget_id: { type: "string", description: "Id from budget_list." },
        label: { type: "string", description: "New label. Max 40 characters." },
        value: {
          type: "number",
          description: "New rupiah-per-month amount, replacing the old one.",
        },
        kind: {
          type: "string",
          enum: ["expense", "savings"],
          description: "Move the line between the expense and savings totals.",
        },
        icon: { type: "string", enum: [...BUDGET_ICONS], description: "New icon." },
        color: { type: "string", description: "New colour as #rrggbb hex." },
      },
      required: ["budget_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Update budget line",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) => {
      const kind = args.kind;
      if (kind !== undefined && kind !== "expense" && kind !== "savings") {
        throw new Error("Parameter kind harus 'expense' atau 'savings'.");
      }
      return await ctx.runMutation(internal.mcp.data.financial.updateBudget, {
        userId,
        budgetId: requireArg(args, "budget_id") as Id<"budgetVariables">,
        label: optionalArg(args, "label"),
        value: optionalNumber(args, "value"),
        kind,
        icon: optionalArg(args, "icon"),
        color: optionalArg(args, "color"),
      });
    },
  },

  {
    name: "budget_delete",
    description:
      "Permanently remove one budget line. There is no undo. When a cost has merely gone down, use budget_update instead — deleting it loses the record that the user was ever tracking it.",
    inputSchema: {
      type: "object",
      properties: {
        budget_id: { type: "string", description: "Id from budget_list." },
      },
      required: ["budget_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Delete budget line",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.mcp.data.financial.deleteBudget, {
        userId,
        budgetId: requireArg(args, "budget_id") as Id<"budgetVariables">,
      }),
  },

  {
    name: "financial_plan_get",
    description:
      "Read the user's relocation / salary plan: target salary and location, monthly expense breakdown, one-off relocation costs, the timeline in months, and the readiness score the app computed from all of it (0-100, where 100 means the money can be saved inside the timeline). Use it for 'am I financially ready to move' or 'what is my target salary'. Returns null when the user has not filled the calculator in — say so rather than guessing, and point them at the Kalkulator Keuangan page. There is no tool to write this; only the app's own calculator can.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: {
      title: "Get financial plan",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId) =>
      await ctx.runQuery(internal.mcp.data.financial.getPlan, { userId }),
  },
];
