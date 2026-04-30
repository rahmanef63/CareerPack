"use client";

import { Calculator, Wallet, AlertCircle, Pencil } from "lucide-react";
import {
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Slider } from "@/shared/components/ui/slider";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/lib/utils";
import {
  formatIDR, formatNumberID, parseNumberID,
} from "@/shared/lib/formatCurrency";
import { iconFor } from "../../constants/budgetIcons";
import { BudgetVariableForm } from "../BudgetVariableForm";
import {
  dynamicSliderMax, SLIDER_BASE_MAX, SLIDER_STEP,
  type BudgetVar, type PeriodView,
} from "./useFinancialPlan";

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

const formatCurrency = formatIDR;

export function BudgetTab(props: Props) {
  const {
    monthlyIncome, setMonthlyIncome, periodView, setPeriodView,
    periodMultiplier, periodSuffix, variables, expenseVars, savingsVars,
    effectiveValue, handleSliderChange,
    totalExpenses, totalSavings, unallocated, savingsRate, expenseData,
  } = props;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-border">
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="w-5 h-5 text-brand" />
                Pendapatan
              </CardTitle>
              <Tabs
                value={periodView}
                onValueChange={(v) => setPeriodView(v as PeriodView)}
                className="w-auto"
              >
                <TabsList variant="equal" cols={2} className="h-8 w-[180px]">
                  <TabsTrigger value="monthly" className="text-xs">Bulanan</TabsTrigger>
                  <TabsTrigger value="yearly" className="text-xs">Tahunan</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Label>
                    {periodView === "yearly" ? "Gaji Tahunan (IDR)" : "Gaji Bulanan (IDR)"}
                  </Label>
                  <span className="font-semibold text-brand">
                    {formatCurrency(monthlyIncome * periodMultiplier)}
                  </span>
                </div>
                <Slider
                  value={[monthlyIncome]}
                  onValueChange={([value]) => setMonthlyIncome(value)}
                  max={dynamicSliderMax(monthlyIncome)}
                  step={SLIDER_STEP}
                  className="w-full"
                />
              </div>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  Rp
                </span>
                <Input
                  inputMode="numeric"
                  value={formatNumberID(monthlyIncome * periodMultiplier)}
                  onChange={(e) => {
                    const parsed = parseNumberID(e.target.value);
                    setMonthlyIncome(
                      periodView === "yearly" ? Math.round(parsed / 12) : parsed,
                    );
                  }}
                  className="pl-9 tabular-nums"
                  aria-label={
                    periodView === "yearly"
                      ? "Masukkan gaji tahunan"
                      : "Masukkan gaji bulanan"
                  }
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Slider sampai {formatCurrency(dynamicSliderMax(monthlyIncome))}
                {periodSuffix === " / bulan" ? " / bulan" : ""}
                {monthlyIncome > SLIDER_BASE_MAX && (
                  <> · rentang slider otomatis menyesuaikan input manual Anda</>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
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
                          <Badge variant="secondary" className="bg-success/15 text-success text-[10px]">
                            Tabungan
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="font-medium text-foreground text-sm">
                          {formatCurrency(current)}
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
                    <Slider
                      value={[current]}
                      onValueChange={([value]) => handleSliderChange(v._id, value)}
                      max={10000000}
                      step={100000}
                      className="w-full"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">
              Ringkasan Budget {periodView === "yearly" ? "Tahunan" : "Bulanan"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-brand-muted rounded-lg">
                <p className="text-sm text-brand">
                  {periodView === "yearly" ? "Pendapatan Tahunan" : "Pendapatan Bulanan"}
                </p>
                <p className="text-2xl font-bold text-brand">
                  {formatCurrency(monthlyIncome * periodMultiplier)}
                </p>
              </div>

              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm text-destructive">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(totalExpenses * periodMultiplier)}
                </p>
              </div>

              <div className="p-4 bg-success/10 rounded-lg">
                <p className="text-sm text-success">Tabungan Direncanakan</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(totalSavings * periodMultiplier)}
                </p>
              </div>

              <div className={cn(
                "p-4 rounded-lg",
                unallocated >= 0 ? "bg-info/10" : "bg-warning/10",
              )}>
                <p className={cn(
                  "text-sm",
                  unallocated >= 0 ? "text-info" : "text-warning",
                )}>
                  {unallocated >= 0 ? "Belum Dialokasikan" : "Kelebihan Alokasi"}
                </p>
                <p className={cn(
                  "text-2xl font-bold",
                  unallocated >= 0 ? "text-info" : "text-warning",
                )}>
                  {formatCurrency(unallocated * periodMultiplier)}
                </p>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tingkat Tabungan</span>
                  <span className={cn(
                    "font-bold",
                    savingsRate >= 20 ? "text-success" : "text-warning",
                  )}>
                    {savingsRate.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
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

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Rincian Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {savingsRate < 20 && (
          <Card className="border-warning/30 bg-warning/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning">Tingkat Tabungan Rendah</p>
                  <p className="text-sm text-warning mt-1">
                    Cobalah menyisihkan minimal 20% pendapatan untuk tabungan. Pertimbangkan untuk mengurangi pengeluaran hiburan.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

