"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { formatIDR } from "@/shared/lib/formatCurrency";
import type { PeriodView } from "../../hooks/useFinancialPlan";

interface Props {
  monthlyIncome: number;
  periodView: PeriodView;
  periodMultiplier: number;
  totalExpenses: number;
  totalSavings: number;
  unallocated: number;
  savingsRate: number;
}

export function BudgetSummaryCard({
  monthlyIncome, periodView, periodMultiplier,
  totalExpenses, totalSavings, unallocated, savingsRate,
}: Props) {
  const yearly = periodView === "yearly";

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle as="h2" className="text-lg">
          Ringkasan Budget {yearly ? "Tahunan" : "Bulanan"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-brand-muted rounded-lg">
            <p className="text-sm text-brand">
              {yearly ? "Pendapatan Tahunan" : "Pendapatan Bulanan"}
            </p>
            <p className="text-2xl font-bold text-brand tabular-nums">
              {formatIDR(monthlyIncome * periodMultiplier)}
            </p>
          </div>

          <div className="p-4 bg-destructive/10 rounded-lg">
            <p className="text-sm text-destructive-text">Total Pengeluaran</p>
            <p className="text-2xl font-bold text-destructive-text tabular-nums">
              {formatIDR(totalExpenses * periodMultiplier)}
            </p>
          </div>

          <div className="p-4 bg-success/10 rounded-lg">
            <p className="text-sm text-success-text">Tabungan Direncanakan</p>
            <p className="text-2xl font-bold text-success-text tabular-nums">
              {formatIDR(totalSavings * periodMultiplier)}
            </p>
          </div>

          <div className={cn(
            "p-4 rounded-lg",
            unallocated >= 0 ? "bg-info/10" : "bg-warning/10",
          )}>
            <p className={cn(
              "text-sm",
              unallocated >= 0 ? "text-info-text" : "text-warning-text",
            )}>
              {unallocated >= 0 ? "Belum Dialokasikan" : "Kelebihan Alokasi"}
            </p>
            <p className={cn(
              "text-2xl font-bold tabular-nums",
              unallocated >= 0 ? "text-info-text" : "text-warning-text",
            )}>
              {formatIDR(unallocated * periodMultiplier)}
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tingkat Tabungan</span>
              <span className={cn(
                "font-bold tabular-nums",
                savingsRate >= 20 ? "text-success-text" : "text-warning-text",
              )}>
                {savingsRate.toFixed(1)}%
              </span>
            </div>
            <div
              className="mt-2 h-2 bg-muted rounded-full overflow-hidden"
              role="progressbar"
              aria-label="Tingkat tabungan"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(Math.max(0, Math.min(100, savingsRate)))}
              aria-valuetext={`${savingsRate.toFixed(1)} persen dari pendapatan`}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  savingsRate >= 20 ? "bg-success" : "bg-warning",
                )}
                style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
