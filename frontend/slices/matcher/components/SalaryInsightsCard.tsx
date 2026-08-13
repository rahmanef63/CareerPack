"use client";

import { useQuery } from "convex/react";
import { TrendingUp } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
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
  if (!data || data.categories.length === 0) return null;

  // A "median" needs a sample. At n=1 this rendered one scraped row as the
  // market rate for a whole category — production had design showing a single
  // listing as its p50. Below the floor the card renders nothing, which is the
  // honest output when 43 of 3,388 listings carry a number at all.
  const visible = data.categories.filter(
    (b) => b.p50 !== null && b.withSalaryCount >= MIN_SAMPLE,
  );
  if (visible.length === 0) return null;

  // Per currency: comparing a USD figure against an IDR one on a shared axis
  // makes every bar meaningless.
  // Compute global max for proportional bar widths across categories.
  // Guard against all-zero data → division by zero → NaN/Infinity widths.
  const maxByCurrency = new Map<string, number>();
  for (const b of visible) {
    const v = b.p75 ?? b.p50 ?? 0;
    maxByCurrency.set(b.currency, Math.max(maxByCurrency.get(b.currency) ?? 0, v));
  }
  const denomFor = (currency: string) => maxByCurrency.get(currency) || 1;

  return (
    // p-4, not p-5: this card now lives in the ~18rem matcher rail.
    <section className="rounded-xl border border-border bg-card p-4">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="h-4 w-4 text-brand" />
            Insight Gaji
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Median (p50) ± rentang p25-p75 dari{" "}
            {data.capped
              ? `${data.scannedCount} lowongan terbaru. Belum mencakup seluruh data historis.`
              : "lowongan terbaru."}{" "}
            Hanya dari lowongan yang mencantumkan gaji.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 whitespace-nowrap">
          {visible.reduce((s, b) => s + b.withSalaryCount, 0)} sampel
        </Badge>
      </header>

      <ul className="space-y-3">
        {visible.map((b) => {
          const label = CATEGORY_LABELS[b.category] ?? b.category;
          const color = CATEGORY_COLORS[b.category] ?? "bg-muted text-muted-foreground";
          const p25 = b.p25 ?? b.p50 ?? 0;
          const p50 = b.p50 ?? 0;
          const p75 = b.p75 ?? p50;
          const denom = denomFor(b.currency);
          const left = (p25 / denom) * 100;
          const right = (p75 / denom) * 100;
          const median = (p50 / denom) * 100;
          return (
            <li key={b.category} className="space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <Badge className={cn("max-w-full shrink-0 truncate border-0", color)}>
                  {label}
                </Badge>
                <span className="font-medium tabular-nums text-foreground">
                  {formatMoney(p50, b.currency)}
                </span>
                <span className="text-muted-foreground">
                  ({formatMoney(p25, b.currency)}–{formatMoney(p75, b.currency)})
                </span>
                <span className="ml-auto text-muted-foreground">
                  {b.withSalaryCount}/{b.count} lowongan · {b.remotePct}% remote
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

/** Below this a "median" is one person's listing, not a market rate. */
const MIN_SAMPLE = 5;

function formatMoney(n: number, currency: string): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (currency === "IDR") {
    return n >= 1_000_000
      ? `IDR ${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}jt`
      : `IDR ${(n / 1_000).toFixed(0)}rb`;
  }
  // "jt" is juta — Indonesian for million. Applying it to USD produced
  // "USD 2.8jt" in production, which reads as neither currency.
  return `${currency} ${n.toLocaleString("en-US")}`;
}
