import {
  Book,
  Briefcase,
  Car,
  CreditCard,
  Film,
  Gift,
  Heart,
  Home,
  MoreHorizontal,
  PiggyBank,
  Plane,
  ShoppingCart,
  Stethoscope,
  Utensils,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Whitelist of icons user can assign to a budget envelope.
 * Keep in sync with `VALID_ICONS` in `convex/budgetVariables.ts`.
 */
export const BUDGET_ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Utensils,
  Car,
  Zap,
  Film,
  MoreHorizontal,
  PiggyBank,
  ShoppingCart,
  Heart,
  Book,
  Briefcase,
  Wallet,
  CreditCard,
  Gift,
  Plane,
  Stethoscope,
};

export const BUDGET_ICON_NAMES = Object.keys(BUDGET_ICON_MAP);

/** Palette for new envelopes — 12 distinct hex values covering warm, cool, neutral. */
export const BUDGET_COLOR_PALETTE: ReadonlyArray<string> = [
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#64748b", // slate
  "#22c55e", // green
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
  "#a855f7", // purple
  "#eab308", // yellow
];

export function iconFor(name: string): LucideIcon {
  return BUDGET_ICON_MAP[name] ?? MoreHorizontal;
}
