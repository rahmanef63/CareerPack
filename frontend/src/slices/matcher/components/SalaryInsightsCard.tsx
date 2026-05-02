"use client";

import { useQuery } from "convex/react";
import { TrendingUp } from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

import { CATEGORY_COLORS, CATEGORY_LABELS } from "../types";

/**
 * Aggregated salary stats per bidang from `jobListings`. Renders a
 * mini "dumbbell" bar (p25 → p75 with p50 marker) so the user can
 * eyeball spread + median at a glance. Currency taken from the
 * dominant value in the bucket — avoids mixing IDR + USD on one bar.
 */
export function SalaryInsightsCard() {
  const data = useQuery(api.matcher.queries.getSalaryInsights);

  if (data === undefined) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }
  if (!data || data.length === 0) return null;

  // Filter out buckets with no salary data — we'd render an empty bar.
  const visible = data.filter((b) => b.p50 !== null && b.withSalaryCount > 0);
  if (visible.length === 0) return null;

  // Compute global max for proportional bar widths across categories.
  const globalMax = Math.max(...visible.map((b) => b.p75 ?? b.p50 ?? 0));

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="h-4 w-4 text-brand" />
            Insight Gaji
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Median (p50) ± rentang p25-p75 dari lowongan terbaru. Hanya dari
            lowongan yang mencantumkan gaji.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {visible.reduce((s, b) => s + b.withSalaryCount, 0)} sample
        </Badge>
      </header>

      <ul className="space-y-3">
        {visible.map((b) => {
          const label = CATEGORY_LABELS[b.category] ?? b.category;
          const color = CATEGORY_COLORS[b.category] ?? "bg-muted text-muted-foreground";
          const p25 = b.p25 ?? b.p50 ?? 0;
          const p50 = b.p50 ?? 0;
          const p75 = b.p75 ?? p50;
          const left = (p25 / globalMax) * 100;
          const right = (p75 / globalMax) * 100;
          const median = (p50 / globalMax) * 100;
          return (
            <li key={b.category} className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge className={cn("border-0 text-[10px]", color)}>{label}</Badge>
                <span className="font-medium tabular-nums text-foreground">
                  {formatMoney(p50, b.currency)}
                </span>
                <span className="text-muted-foreground">
                  ({formatMoney(p25, b.currency)}–{formatMoney(p75, b.currency)})
                </span>
                <span className="ml-auto text-muted-foreground">
                  {b.withSalaryCount}/{b.count} listing · {b.remotePct}% remote
                </span>
              </div>
              {/* Dumbbell bar */}
              <div className="relative h-2 rounded-full bg-muted">
                <div
                  className="absolute h-2 rounded-full bg-brand/70"
                  style={{ left: `${left}%`, width: `${Math.max(right - left, 1)}%` }}
                />
                <div
                  className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-background bg-brand"
                  style={{ left: `${median}%` }}
                  aria-label={`Median ${formatMoney(p50, b.currency)}`}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function formatMoney(n: number, currency: string): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (currency === "IDR") {
    return n >= 1_000_000
      ? `IDR ${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}jt`
      : `IDR ${(n / 1_000).toFixed(0)}rb`;
  }
  if (n >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${currency} ${(n / 1_000).toFixed(0)}k`;
  return `${currency} ${n.toLocaleString()}`;
}
