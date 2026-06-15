"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";

export type BudgetVar = Doc<"budgetVariables">;
export type PeriodView = "monthly" | "yearly";

export const SLIDER_BASE_MAX = 50_000_000;
export const SLIDER_STEP = 500_000;

/** Pick a slider max that always exceeds the current income so the handle
 *  stays reachable. Rounds up to the next 10jt above the income. */
export function dynamicSliderMax(income: number): number {
  if (income <= SLIDER_BASE_MAX) return SLIDER_BASE_MAX;
  return Math.ceil(income / 10_000_000) * 10_000_000;
}

export function useFinancialPlan() {
  const [monthlyIncome, setMonthlyIncome] = useState(15000000);
  const [periodView, setPeriodView] = useState<PeriodView>("monthly");

  const plan = useQuery(api.financial.queries.getUserFinancialPlan);
  const savePlan = useMutation(api.financial.mutations.createOrUpdateFinancialPlan);
  const incomeHydrated = useRef(false);
  const planDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest plan-write closure, refreshed each debounce cycle, so the
  // unmount flush can fire the queued plan write with up-to-date values.
  const pendingPlanWrite = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (plan === undefined) return;
    if (incomeHydrated.current) return;
    incomeHydrated.current = true;
    if (plan && plan.targetSalary > 0) {
      setMonthlyIncome(plan.targetSalary);
    }
  }, [plan]);

  const periodMultiplier = periodView === "yearly" ? 12 : 1;
  const periodSuffix = periodView === "yearly" ? " / tahun" : " / bulan";

  const variables = useQuery(api.financial.queries.listBudgetVariables);
  const seedDefaults = useMutation(api.financial.mutations.seedBudgetDefaults);
  const updateVariable = useMutation(api.financial.mutations.updateBudgetVariable);

  const seedAttempted = useRef(false);
  useEffect(() => {
    if (variables && variables.length === 0 && !seedAttempted.current) {
      seedAttempted.current = true;
      seedDefaults().catch(() => {});
    }
  }, [variables, seedDefaults]);

  const [localValues, setLocalValues] = useState<Record<string, number>>({});
  // Each entry keeps the live timer plus the latest value queued for that
  // variable, so a still-pending slider write can be flushed (not just
  // cancelled) when the view unmounts mid-drag.
  const debounceTimers = useRef<
    Map<string, { timer: ReturnType<typeof setTimeout>; value: number }>
  >(new Map());

  useEffect(() => {
    if (!variables) return;
    setLocalValues((prev) => {
      const next: Record<string, number> = { ...prev };
      for (const v of variables) {
        if (!(v._id in next)) next[v._id] = v.value;
      }
      return next;
    });
  }, [variables]);

  const handleSliderChange = (id: string, value: number) => {
    setLocalValues((prev) => ({ ...prev, [id]: value }));
    const existing = debounceTimers.current.get(id);
    if (existing) clearTimeout(existing.timer);
    const t = setTimeout(() => {
      updateVariable({ id: id as Id<"budgetVariables">, value }).catch(() => {});
      debounceTimers.current.delete(id);
    }, 400);
    debounceTimers.current.set(id, { timer: t, value });
  };

  // Mount-only: on unmount (route change / nav away mid-drag) flush every
  // queued slider write with its last value, then the queued plan write,
  // instead of dropping them. Refs are stable so this never re-runs.
  useEffect(() => {
    const sliderTimers = debounceTimers.current;
    return () => {
      for (const [id, { timer, value }] of sliderTimers) {
        clearTimeout(timer);
        updateVariable({ id: id as Id<"budgetVariables">, value }).catch(() => {});
      }
      sliderTimers.clear();
      if (planDebounce.current) {
        clearTimeout(planDebounce.current);
        planDebounce.current = null;
        pendingPlanWrite.current?.();
        pendingPlanWrite.current = null;
      }
    };
  }, [updateVariable]);

  const sortedVars: BudgetVar[] = useMemo(
    () => (variables ? [...variables].sort((a, b) => a.order - b.order) : []),
    [variables],
  );

  const effectiveValue = (v: BudgetVar) =>
    v._id in localValues ? localValues[v._id] : v.value;

  const expenseVars = sortedVars.filter((v) => v.kind === "expense");
  const savingsVars = sortedVars.filter((v) => v.kind === "savings");

  useEffect(() => {
    if (plan === undefined || !incomeHydrated.current) return;
    if (planDebounce.current) clearTimeout(planDebounce.current);
    // Build the write once, capture it for the unmount flush, and reuse
    // it when the timer fires so both paths persist identical values.
    const writePlan = () => {
      const valueOf = (v: BudgetVar) =>
        v._id in localValues ? localValues[v._id] : v.value;
      const bucketize = (kind: string) =>
        sortedVars
          .filter((v) => v.label.toLowerCase().includes(kind))
          .reduce((s, v) => s + valueOf(v), 0);
      savePlan({
        type: "salary",
        targetSalary: monthlyIncome,
        expenses: {
          housing: bucketize("tempat") + bucketize("sewa") + bucketize("kos"),
          food: bucketize("makan"),
          transportation: bucketize("transport"),
          utilities: bucketize("listrik") + bucketize("air") + bucketize("internet"),
          entertainment: bucketize("hiburan"),
          others: 0,
        },
        timeline: 12,
      }).catch(() => {});
    };
    pendingPlanWrite.current = writePlan;
    planDebounce.current = setTimeout(() => {
      pendingPlanWrite.current = null;
      planDebounce.current = null;
      writePlan();
    }, 800);
    return () => {
      if (planDebounce.current) clearTimeout(planDebounce.current);
    };
  }, [monthlyIncome, sortedVars, localValues, plan, savePlan]);

  const totalExpenses = expenseVars.reduce((sum, v) => sum + effectiveValue(v), 0);
  const totalSavings = savingsVars.reduce((sum, v) => sum + effectiveValue(v), 0);
  const totalAllocated = totalExpenses + totalSavings;
  const unallocated = monthlyIncome - totalAllocated;
  const savingsRate = monthlyIncome > 0 ? (totalSavings / monthlyIncome) * 100 : 0;

  const expenseData = sortedVars.map((v) => ({
    name: v.label,
    value: effectiveValue(v),
    color: v.color,
  }));

  return {
    monthlyIncome, setMonthlyIncome,
    periodView, setPeriodView, periodMultiplier, periodSuffix,
    variables, sortedVars, expenseVars, savingsVars,
    effectiveValue, handleSliderChange,
    totalExpenses, totalSavings, unallocated, savingsRate, expenseData,
  };
}
