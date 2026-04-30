"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../../convex/_generated/dataModel";

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
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      updateVariable({ id: id as Id<"budgetVariables">, value }).catch(() => {});
      debounceTimers.current.delete(id);
    }, 400);
    debounceTimers.current.set(id, t);
  };

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
    planDebounce.current = setTimeout(() => {
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
