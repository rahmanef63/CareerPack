"use client";

import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { CalculatorSplit } from "./CalculatorSplit";
import { BudgetIncomeCard } from "./BudgetIncomeCard";
import { BudgetVariablesCard } from "./BudgetVariablesCard";
import { BudgetSummaryCard } from "./BudgetSummaryCard";
import { BudgetBreakdownCard } from "./BudgetBreakdownCard";
import type { BudgetVar, PeriodView } from "../../hooks/useFinancialPlan";

interface Props {
  monthlyIncome: number;
  setMonthlyIncome: (v: number) => void;
  periodView: PeriodView;
  setPeriodView: (v: PeriodView) => void;
  periodMultiplier: number;
  periodSuffix: string;
  variables: BudgetVar[] | undefined;
  expenseVars: BudgetVar[];
  savingsVars: BudgetVar[];
  effectiveValue: (v: BudgetVar) => number;
  handleSliderChange: (id: string, value: number) => void;
  totalExpenses: number;
  totalSavings: number;
  unallocated: number;
  savingsRate: number;
  expenseData: { name: string; value: number; color: string }[];
}

export function BudgetTab(props: Props) {
  const {
    monthlyIncome, setMonthlyIncome, periodView, setPeriodView,
    periodMultiplier, periodSuffix, variables, expenseVars, savingsVars,
    effectiveValue, handleSliderChange,
    totalExpenses, totalSavings, unallocated, savingsRate, expenseData,
  } = props;

  return (
    <CalculatorSplit
      railLabel="Ringkasan anggaran"
      rail={
        <>
          <BudgetSummaryCard
            monthlyIncome={monthlyIncome}
            periodView={periodView}
            periodMultiplier={periodMultiplier}
            totalExpenses={totalExpenses}
            totalSavings={totalSavings}
            unallocated={unallocated}
            savingsRate={savingsRate}
          />

          <BudgetBreakdownCard
            expenseData={expenseData}
            periodMultiplier={periodMultiplier}
          />

          {savingsRate < 20 && (
            <Card className="border-warning/30 bg-warning/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-warning-text">Tingkat Tabungan Rendah</p>
                    <p className="text-sm text-warning-text mt-1">
                      Cobalah menyisihkan minimal 20% pendapatan untuk tabungan. Pertimbangkan untuk mengurangi pengeluaran hiburan.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      }
    >
      <BudgetIncomeCard
        monthlyIncome={monthlyIncome}
        setMonthlyIncome={setMonthlyIncome}
        periodView={periodView}
        setPeriodView={setPeriodView}
        periodMultiplier={periodMultiplier}
        periodSuffix={periodSuffix}
      />

      <BudgetVariablesCard
        variables={variables}
        expenseVars={expenseVars}
        savingsVars={savingsVars}
        effectiveValue={effectiveValue}
        handleSliderChange={handleSliderChange}
      />
    </CalculatorSplit>
  );
}
