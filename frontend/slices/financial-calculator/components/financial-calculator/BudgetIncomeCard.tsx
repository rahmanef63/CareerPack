"use client";

import { Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/shared/components/ui/toggle-group";
import {
  formatIDR, formatNumberID, parseNumberID,
} from "@/shared/lib/formatCurrency";
import { LabeledSlider } from "./LabeledSlider";
import {
  dynamicSliderMax, SLIDER_BASE_MAX, SLIDER_STEP, type PeriodView,
} from "../../hooks/useFinancialPlan";

interface Props {
  monthlyIncome: number;
  setMonthlyIncome: (v: number) => void;
  periodView: PeriodView;
  setPeriodView: (v: PeriodView) => void;
  periodMultiplier: number;
  periodSuffix: string;
}

const PERIODS: ReadonlyArray<{ value: PeriodView; label: string }> = [
  { value: "monthly", label: "Bulanan" },
  { value: "yearly", label: "Tahunan" },
];

export function BudgetIncomeCard({
  monthlyIncome, setMonthlyIncome,
  periodView, setPeriodView, periodMultiplier, periodSuffix,
}: Props) {
  const displayed = monthlyIncome * periodMultiplier;
  const incomeLabel =
    periodView === "yearly" ? "Gaji Tahunan (IDR)" : "Gaji Bulanan (IDR)";

  return (
    <Card className="border-border">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle as="h2" className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-brand" />
            Pendapatan
          </CardTitle>
          {/* Was a Radix `Tabs` with a TabsList but no TabsContent, so the
              selected trigger's `aria-controls` pointed at a panel that
              never existed (axe `aria-valid-attr-value`, critical). This is
              a segmented control, not a tab set — ToggleGroup says so.
              No bespoke h-/w- beyond matching TabsList's own `h-11 sm:h-9`
              (WCAG 2.5.5 mobile target); a fixed width used to overflow the
              card's right edge at 390px. */}
          <ToggleGroup
            type="single"
            value={periodView}
            onValueChange={(v) => {
              // Radix allows deselecting the active item in single mode;
              // an empty period would blank every derived number.
              if (v) setPeriodView(v as PeriodView);
            }}
            // Radix labels the root `group`; `radiogroup` is the accurate
            // parent for its `role="radio"` items and overrides cleanly
            // (the primitive spreads incoming props after its own role).
            role="radiogroup"
            aria-label="Periode tampilan"
            className="h-11 shrink-0 gap-1 rounded-lg bg-muted p-1 sm:h-9"
          >
            {PERIODS.map((p) => (
              <ToggleGroupItem
                key={p.value}
                value={p.value}
                className="h-full rounded-md px-3 text-xs font-medium text-muted-foreground hover:bg-background/50 hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-md data-[state=on]:ring-1 data-[state=on]:ring-border/60"
              >
                {p.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2 gap-2">
              <Label>{incomeLabel}</Label>
              <span className="font-semibold text-brand tabular-nums">
                {formatIDR(displayed)}
              </span>
            </div>
            <LabeledSlider
              label={incomeLabel}
              valueText={`${formatIDR(displayed)}${periodSuffix}`}
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
              value={formatNumberID(displayed)}
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
            Slider sampai {formatIDR(dynamicSliderMax(monthlyIncome))}
            {periodSuffix === " / bulan" ? " / bulan" : ""}
            {monthlyIncome > SLIDER_BASE_MAX && (
              <> · rentang slider otomatis menyesuaikan input manual Anda</>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
