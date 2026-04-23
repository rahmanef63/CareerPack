import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc } from "./_lib/auth";

// Whitelist of icon names — must match frontend mapping in
// financial-calculator/components/FinancialCalculator.tsx.
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

// Default envelope set — seeded on first listMine call if the user has
// none yet. Matches the prior hardcoded categories + adds "tabungan"
// as the 7th envelope (kind=savings).
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

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("budgetVariables")
      .withIndex("by_user_order", (q) => q.eq("userId", userId))
      .collect();
    return rows.sort((a, b) => a.order - b.order);
  },
});

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("budgetVariables")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) return { seeded: false };

    for (let i = 0; i < DEFAULT_VARS.length; i++) {
      const v = DEFAULT_VARS[i];
      await ctx.db.insert("budgetVariables", {
        userId,
        label: v.label,
        value: v.value,
        iconName: v.iconName,
        color: v.color,
        order: i,
        kind: v.kind,
      });
    }
    return { seeded: true };
  },
});

export const createVariable = mutation({
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

export const updateVariable = mutation({
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

export const removeVariable = mutation({
  args: { id: v.id("budgetVariables") },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.id, "Variabel anggaran");
    await ctx.db.delete(args.id);
  },
});
