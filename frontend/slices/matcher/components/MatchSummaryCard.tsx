"use client";

import { Sparkles } from "lucide-react";

import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

import type { JobMatch } from "../types";

interface MatchSummaryCardProps {
  matches: ReadonlyArray<JobMatch>;
  loading: boolean;
}

/**
 * Rail card: how the already-computed match scores are distributed.
 *
 * Pure presentation over `api.matcher.queries.getMatches` output — it
 * counts scores into bands and never recomputes one. The carousel above
 * shows *which* jobs matched; this answers "how good is the pool", the
 * question the carousel can't without being scrolled end to end.
 */
const BANDS: ReadonlyArray<{
  label: string;
  min: number;
  bar: string;
  text: string;
}> = [
  {
    label: "Sangat cocok",
    min: 80,
    bar: "bg-success",
    text: "text-success-text",
  },
  { label: "Cocok", min: 60, bar: "bg-info", text: "text-info-text" },
  {
    label: "Perlu penyesuaian",
    min: 0,
    bar: "bg-warning",
    text: "text-warning-text",
  },
];

export function MatchSummaryCard({ matches, loading }: MatchSummaryCardProps) {
  if (loading) {
    return <Skeleton className="h-44 w-full rounded-xl" />;
  }

  const total = matches.length;

  if (total === 0) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-card p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-brand" />
          Kecocokan Profil
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Lengkapi target posisi, skill, dan lokasi di Profil supaya AI bisa
          menghitung kecocokan lowongan untuk kamu.
        </p>
      </section>
    );
  }

  const best = matches.reduce((m, x) => Math.max(m, x.score), 0);
  const average = Math.round(
    matches.reduce((s, x) => s + x.score, 0) / total,
  );

  const counts = BANDS.map((band, i) => {
    const upper = i === 0 ? Infinity : BANDS[i - 1].min;
    return matches.filter((m) => m.score >= band.min && m.score < upper).length;
  });

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <header className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-brand" />
          Kecocokan Profil
        </h2>
        <span className="text-xs text-muted-foreground">
          {total} teratas
        </span>
      </header>

      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold tabular-nums text-brand">
          {best}%
        </span>
        <span className="text-xs text-muted-foreground">
          skor terbaik · rata-rata{" "}
          <span className="font-medium tabular-nums text-foreground">
            {average}%
          </span>
        </span>
      </div>

      <ul className="space-y-2">
        {BANDS.map((band, i) => {
          const count = counts[i];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <li key={band.label} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className={cn("font-medium", band.text)}>
                  {band.label}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {count}
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-muted"
                role="presentation"
              >
                <div
                  className={cn("h-full rounded-full", band.bar)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-muted-foreground">
        Skor dihitung dari target posisi, skill, dan lokasi di profil kamu.
      </p>
    </section>
  );
}
