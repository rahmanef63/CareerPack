"use client";

import { Calculator, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { formatIDR } from "@/shared/lib/formatCurrency";
import { iconFor } from "../../constants/budgetIcons";
import { BudgetVariableForm } from "../BudgetVariableForm";
import { LabeledSlider } from "./LabeledSlider";
import type { BudgetVar } from "../../hooks/useFinancialPlan";

interface Props {
  variables: BudgetVar[] | undefined;
  expenseVars: BudgetVar[];
  savingsVars: BudgetVar[];
  effectiveValue: (v: BudgetVar) => number;
  handleSliderChange: (id: string, value: number) => void;
}

export function BudgetVariablesCard({
  variables, expenseVars, savingsVars, effectiveValue, handleSliderChange,
}: Props) {
  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle as="h2" className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-brand" />
            Variabel Anggaran Bulanan
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Pengeluaran &amp; tabungan — drag slider, edit label, atau tambah baru.
          </p>
        </div>
        <BudgetVariableForm />
      </CardHeader>
      <CardContent>
        {variables === undefined && (
          <p className="text-sm text-muted-foreground">Memuat variabel…</p>
        )}
        {variables && variables.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Belum ada variabel. Menyiapkan default…
          </p>
        )}
        <div className="space-y-6">
          {[...expenseVars, ...savingsVars].map((v) => {
            const Icon = iconFor(v.iconName);
            const current = effectiveValue(v);
            return (
              <div key={v._id}>
                <div className="flex justify-between items-center mb-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" style={{ color: v.color }} />
                    <Label className="text-sm truncate">{v.label}</Label>
                    {v.kind === "savings" && (
                      <Badge
                        variant="secondary"
                        className="bg-success/15 text-success-text text-xs"
                      >
                        Tabungan
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-medium text-foreground text-sm tabular-nums">
                      {formatIDR(current)}
                    </span>
                    <BudgetVariableForm
                      existing={v}
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label={`Edit ${v.label}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                  </div>
                </div>
                <LabeledSlider
                  label={`Anggaran ${v.label} per bulan`}
                  valueText={`${formatIDR(current)} / bulan`}
                  value={[current]}
                  onValueChange={([value]) => handleSliderChange(v._id, value)}
                  // Ceiling follows the row's own value — the form accepts
                  // up to 1 miliar, so a fixed 10jt cap silently truncated
                  // any larger envelope on the first drag.
                  max={Math.max(10_000_000, Math.ceil(current / 1_000_000) * 1_000_000)}
                  step={100000}
                  className="w-full"
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
