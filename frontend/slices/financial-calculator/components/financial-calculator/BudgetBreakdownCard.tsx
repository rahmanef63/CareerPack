"use client";

import {
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatIDR } from "@/shared/lib/formatCurrency";

interface Props {
  /** Every budget envelope (expenses *and* savings), as fed to the chart. */
  expenseData: { name: string; value: number; color: string }[];
  periodMultiplier: number;
}

/**
 * Allocation breakdown — donut chart plus the same numbers as text.
 *
 * The chart is `aria-hidden`. Recharts hardcodes `tabIndex={-1}` on every
 * sector `<path>`, and an SVG shape carrying a tabindex picks up an
 * implicit `graphics-symbol` role, so all 7 sectors failed axe
 * `svg-img-alt` (no accessible name) with no prop to turn it off. The
 * list below is the text alternative — and it doubles as the legend the
 * donut never had, so sighted users stop having to hover each slice to
 * learn which colour is which. `rootTabIndex={-1}` keeps the chart out
 * of the tab order, which is required: focusable content must never sit
 * inside an `aria-hidden` subtree.
 */
export function BudgetBreakdownCard({ expenseData, periodMultiplier }: Props) {
  // Zero-value envelopes render no sector, so they're left out of the
  // list too — chart and text stay in step.
  const rows = expenseData.filter((d) => d.value > 0);
  const total = rows.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle as="h2" className="text-lg">Rincian Alokasi</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada alokasi untuk ditampilkan.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="h-[200px]" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rows}
                    rootTabIndex={-1}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {rows.map((entry, index) => (
                      <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatIDR(value * periodMultiplier)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Two lines per row, not label | amount | share on one:
                the rail is 288px at lg, which truncates any label
                longer than "Transportasi" once three columns share it. */}
            <ul className="space-y-2.5">
              {rows.map((row, index) => {
                const share = total > 0 ? (row.value / total) * 100 : 0;
                return (
                  <li
                    key={`${row.name}-${index}`}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-muted-foreground" title={row.name}>
                        {row.name}
                      </span>
                      <span className="block font-medium text-foreground tabular-nums">
                        {formatIDR(row.value * periodMultiplier)}
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          {Math.round(share)}%
                        </span>
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between gap-2 border-t border-border pt-3 text-sm">
              <span className="min-w-0 text-muted-foreground">Total Alokasi</span>
              <span className="shrink-0 font-semibold text-foreground tabular-nums">
                {formatIDR(total * periodMultiplier)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
