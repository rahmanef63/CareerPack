import { internalQuery, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { enforceRateLimit } from "../../_shared/rateLimit";
import { assertShortText } from "../../_shared/validate";
import { MCP_WRITE_LIMIT, MCP_WRITE_DAILY_LIMIT } from "./limits";

/**
 * Data layer for convex/mcp/tools/financial.ts. Internal only, `userId` is an
 * argument and is re-checked against every document — see
 * convex/mcp/data/cv.ts.
 */

/**
 * Deliberate copy of the icon whitelist in financial/mutations.ts, which
 * keeps it module-private. It is not really duplication: the same list has to
 * appear as the `icon` enum in the tool's inputSchema or the model invents
 * names the budget page cannot render, so one exported const feeds both.
 */
export const BUDGET_ICONS = [
  "Home",
  "Utensils",
  "Car",
  "Zap",
  "Film",
  "MoreHorizontal",
  "PiggyBank",
  "ShoppingCart",
  "Heart",
  "Book",
  "Briefcase",
  "Wallet",
  "CreditCard",
  "Gift",
  "Plane",
  "Stethoscope",
] as const;

const ICONS = new Set<string>(BUDGET_ICONS);
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
/** Slate-500. Neutral enough that an unstyled line does not claim a meaning. */
const DEFAULT_COLOR = "#64748b";
const MAX_VALUE = 1_000_000_000;

function assertValue(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Nilai harus berupa angka positif");
  }
  if (value > MAX_VALUE) throw new Error("Nilai terlalu besar");
  return Math.round(value);
}

function assertIcon(name: string): string {
  if (!ICONS.has(name)) throw new Error(`Ikon '${name}' tidak valid`);
  return name;
}

function assertColor(hex: string): string {
  if (!HEX_COLOR.test(hex)) throw new Error("Warna harus format hex #rrggbb");
  return hex.toLowerCase();
}

export const listBudget = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("budgetVariables")
      .withIndex("by_user_order", (q) => q.eq("userId", args.userId))
      .collect();
    const items = rows
      .sort((a, b) => a.order - b.order)
      .map((r) => ({
        budget_id: r._id,
        label: r.label,
        value: r.value,
        kind: r.kind,
        icon: r.iconName,
        color: r.color,
      }));
    return {
      items,
      total_expense: items
        .filter((r) => r.kind === "expense")
        .reduce((sum, r) => sum + r.value, 0),
      total_savings: items
        .filter((r) => r.kind === "savings")
        .reduce((sum, r) => sum + r.value, 0),
    };
  },
});

export const getPlan = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const plan = await ctx.db
      .query("financialPlans")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!plan) return null;
    return {
      type: plan.type,
      target_location: plan.targetLocation ?? null,
      current_salary: plan.currentSalary ?? null,
      target_salary: plan.targetSalary,
      expenses: plan.expenses,
      relocation_costs: plan.relocationCosts ?? null,
      timeline_months: plan.timeline,
      readiness_score: plan.readinessScore,
    };
  },
});

export const addBudget = internalMutation({
  args: {
    userId: v.id("users"),
    label: v.string(),
    value: v.number(),
    kind: v.union(v.literal("expense"), v.literal("savings")),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_LIMIT);
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_DAILY_LIMIT);

    const label = assertShortText(args.label, 40, "Label");
    if (label.length === 0) throw new Error("Label tidak boleh kosong");
    const value = assertValue(args.value);

    const existing = await ctx.db
      .query("budgetVariables")
      .withIndex("by_user_order", (q) => q.eq("userId", args.userId))
      .collect();

    const budgetId = await ctx.db.insert("budgetVariables", {
      userId: args.userId,
      label,
      value,
      iconName: args.icon ? assertIcon(args.icon) : "Wallet",
      color: args.color ? assertColor(args.color) : DEFAULT_COLOR,
      order: existing.reduce((m, r) => Math.max(m, r.order), -1) + 1,
      kind: args.kind,
    });
    return { budget_id: budgetId, label, value };
  },
});

export const updateBudget = internalMutation({
  args: {
    userId: v.id("users"),
    budgetId: v.id("budgetVariables"),
    label: v.optional(v.string()),
    value: v.optional(v.number()),
    kind: v.optional(v.union(v.literal("expense"), v.literal("savings"))),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_LIMIT);
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_DAILY_LIMIT);

    const row = await ctx.db.get(args.budgetId);
    if (!row || row.userId !== args.userId) {
      throw new Error("Variabel anggaran tidak ditemukan");
    }

    const patch: Record<string, unknown> = {};
    if (args.label !== undefined) {
      const label = assertShortText(args.label, 40, "Label");
      if (label.length === 0) throw new Error("Label tidak boleh kosong");
      patch.label = label;
    }
    if (args.value !== undefined) patch.value = assertValue(args.value);
    if (args.kind !== undefined) patch.kind = args.kind;
    if (args.icon !== undefined) patch.iconName = assertIcon(args.icon);
    if (args.color !== undefined) patch.color = assertColor(args.color);
    if (Object.keys(patch).length === 0) {
      throw new Error("Tidak ada field yang diubah");
    }

    await ctx.db.patch(args.budgetId, patch);
    // Echo the row as the tools name it (`icon`, not the stored `iconName`),
    // so the model reading the result can feed it straight back into
    // budget_update without renaming anything.
    return {
      budget_id: args.budgetId,
      label: patch.label ?? row.label,
      value: patch.value ?? row.value,
      kind: patch.kind ?? row.kind,
      icon: patch.iconName ?? row.iconName,
      color: patch.color ?? row.color,
    };
  },
});

export const deleteBudget = internalMutation({
  args: { userId: v.id("users"), budgetId: v.id("budgetVariables") },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_LIMIT);
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_DAILY_LIMIT);

    const row = await ctx.db.get(args.budgetId);
    if (!row || row.userId !== args.userId) {
      throw new Error("Variabel anggaran tidak ditemukan");
    }
    await ctx.db.delete(args.budgetId);
    return { deleted: true };
  },
});
