import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc } from "../_shared/auth";

const MAX_TYPE_LEN = 50;
const MAX_LOCATION_LEN = 100;
const MAX_AMOUNT = 1e12;
const MAX_TIMELINE_MONTHS = 240;

function trimLen(field: string, value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) {
    throw new Error(`${field} 1-${max} karakter`);
  }
  return trimmed;
}

function optTrim(field: string, value: string | undefined, max: number): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Error(`${field} maksimal ${max} karakter`);
  return trimmed || undefined;
}

function assertAmount(field: string, n: number): number {
  if (!Number.isFinite(n) || n < 0 || n > MAX_AMOUNT) {
    throw new Error(`${field} harus 0-${MAX_AMOUNT}`);
  }
  return n;
}

function assertOptAmount(field: string, n: number | undefined): number | undefined {
  if (n === undefined) return undefined;
  return assertAmount(field, n);
}

export const createOrUpdateFinancialPlan = mutation({
  args: {
    type: v.string(),
    targetLocation: v.optional(v.string()),
    currentSalary: v.optional(v.number()),
    targetSalary: v.number(),
    expenses: v.object({
      housing: v.number(),
      food: v.number(),
      transportation: v.number(),
      utilities: v.number(),
      entertainment: v.number(),
      others: v.number(),
    }),
    relocationCosts: v.optional(v.object({
      visa: v.number(),
      flights: v.number(),
      accommodation: v.number(),
      shipping: v.number(),
      emergency: v.number(),
    })),
    timeline: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const type = trimLen("Tipe", args.type, MAX_TYPE_LEN);
    const targetLocation = optTrim("Lokasi", args.targetLocation, MAX_LOCATION_LEN);

    const targetSalary = assertAmount("Target salary", args.targetSalary);
    const currentSalary = assertOptAmount("Current salary", args.currentSalary);
    const expenses = {
      housing: assertAmount("Housing", args.expenses.housing),
      food: assertAmount("Food", args.expenses.food),
      transportation: assertAmount("Transportation", args.expenses.transportation),
      utilities: assertAmount("Utilities", args.expenses.utilities),
      entertainment: assertAmount("Entertainment", args.expenses.entertainment),
      others: assertAmount("Others", args.expenses.others),
    };
    const relocationCosts = args.relocationCosts
      ? {
          visa: assertAmount("Visa", args.relocationCosts.visa),
          flights: assertAmount("Flights", args.relocationCosts.flights),
          accommodation: assertAmount("Accommodation", args.relocationCosts.accommodation),
          shipping: assertAmount("Shipping", args.relocationCosts.shipping),
          emergency: assertAmount("Emergency", args.relocationCosts.emergency),
        }
      : undefined;

    if (!Number.isFinite(args.timeline) || args.timeline < 1 || args.timeline > MAX_TIMELINE_MONTHS) {
      throw new Error(`Timeline 1-${MAX_TIMELINE_MONTHS} bulan`);
    }
    const timeline = args.timeline;

    const totalExpenses = Object.values(expenses).reduce((sum, exp) => sum + exp, 0);
    const monthlyNet = targetSalary / 12 - totalExpenses;
    const relocationTotal = relocationCosts
      ? Object.values(relocationCosts).reduce((sum, cost) => sum + cost, 0)
      : 0;
    const emergencyFund = totalExpenses * 6;
    const totalNeeded = relocationTotal + emergencyFund;

    let readinessScore = 0;
    if (monthlyNet > 0) {
      const monthsToSave = totalNeeded / monthlyNet;
      if (monthsToSave <= timeline) readinessScore = 100;
      else if (monthsToSave <= timeline * 1.5) readinessScore = 75;
      else if (monthsToSave <= timeline * 2) readinessScore = 50;
      else readinessScore = 25;
    }

    const existing = await ctx.db
      .query("financialPlans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const planData = {
      userId,
      type,
      targetLocation,
      currentSalary,
      targetSalary,
      expenses,
      relocationCosts,
      timeline,
      readinessScore,
    };

    if (existing) {
      await ctx.db.patch(existing._id, planData);
      return existing._id;
    }
    return await ctx.db.insert("financialPlans", planData);
  },
});

export const deleteFinancialPlan = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("financialPlans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

// ----- Budget envelopes -----

const VALID_ICONS = [
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

type IconName = typeof VALID_ICONS[number];

function isValidIcon(name: string): name is IconName {
  return (VALID_ICONS as readonly string[]).includes(name);
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function assertLabel(label: string): string {
  const trimmed = label.trim();
  if (trimmed.length === 0) throw new Error("Label tidak boleh kosong");
  if (trimmed.length > 40) throw new Error("Label maksimal 40 karakter");
  return trimmed;
}

function assertValue(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Nilai harus berupa angka positif");
  }
  if (value > 1_000_000_000) {
    throw new Error("Nilai terlalu besar");
  }
  return Math.round(value);
}

function assertIcon(name: string): IconName {
  if (!isValidIcon(name)) throw new Error(`Ikon '${name}' tidak valid`);
  return name;
}

function assertColor(hex: string): string {
  if (!HEX_COLOR.test(hex)) throw new Error("Warna harus format hex #rrggbb");
  return hex.toLowerCase();
}

const DEFAULT_VARS: ReadonlyArray<{
  label: string;
  value: number;
  iconName: IconName;
  color: string;
  kind: "expense" | "savings";
}> = [
  { label: "Tempat Tinggal/Sewa", value: 5_000_000, iconName: "Home", color: "#0ea5e9", kind: "expense" },
  { label: "Makanan & Belanja", value: 2_500_000, iconName: "Utensils", color: "#10b981", kind: "expense" },
  { label: "Transportasi", value: 1_500_000, iconName: "Car", color: "#f59e0b", kind: "expense" },
  { label: "Utilitas", value: 1_000_000, iconName: "Zap", color: "#8b5cf6", kind: "expense" },
  { label: "Hiburan", value: 1_000_000, iconName: "Film", color: "#ec4899", kind: "expense" },
  { label: "Lainnya", value: 1_000_000, iconName: "MoreHorizontal", color: "#64748b", kind: "expense" },
  { label: "Tabungan", value: 2_000_000, iconName: "PiggyBank", color: "#22c55e", kind: "savings" },
];

export const seedBudgetDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("budgetVariables")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) return { seeded: false };

    for (let i = 0; i < DEFAULT_VARS.length; i++) {
      const row = DEFAULT_VARS[i];
      await ctx.db.insert("budgetVariables", {
        userId,
        label: row.label,
        value: row.value,
        iconName: row.iconName,
        color: row.color,
        order: i,
        kind: row.kind,
      });
    }
    return { seeded: true };
  },
});

export const createBudgetVariable = mutation({
  args: {
    label: v.string(),
    value: v.number(),
    iconName: v.string(),
    color: v.string(),
    kind: v.union(v.literal("expense"), v.literal("savings")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const label = assertLabel(args.label);
    const value = assertValue(args.value);
    const iconName = assertIcon(args.iconName);
    const color = assertColor(args.color);

    const existing = await ctx.db
      .query("budgetVariables")
      .withIndex("by_user_order", (q) => q.eq("userId", userId))
      .collect();
    const maxOrder = existing.reduce((m, r) => Math.max(m, r.order), -1);

    return await ctx.db.insert("budgetVariables", {
      userId,
      label,
      value,
      iconName,
      color,
      order: maxOrder + 1,
      kind: args.kind,
    });
  },
});

export const updateBudgetVariable = mutation({
  args: {
    id: v.id("budgetVariables"),
    label: v.optional(v.string()),
    value: v.optional(v.number()),
    iconName: v.optional(v.string()),
    color: v.optional(v.string()),
    kind: v.optional(v.union(v.literal("expense"), v.literal("savings"))),
  },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.id, "Variabel anggaran");

    const patch: Partial<{
      label: string;
      value: number;
      iconName: string;
      color: string;
      kind: "expense" | "savings";
    }> = {};
    if (args.label !== undefined) patch.label = assertLabel(args.label);
    if (args.value !== undefined) patch.value = assertValue(args.value);
    if (args.iconName !== undefined) patch.iconName = assertIcon(args.iconName);
    if (args.color !== undefined) patch.color = assertColor(args.color);
    if (args.kind !== undefined) patch.kind = args.kind;

    await ctx.db.patch(args.id, patch);
  },
});

export const removeBudgetVariable = mutation({
  args: { id: v.id("budgetVariables") },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.id, "Variabel anggaran");
    await ctx.db.delete(args.id);
  },
});
