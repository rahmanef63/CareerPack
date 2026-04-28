"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, AlertCircle, Info, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { cn } from "@/shared/lib/utils";
import type { BrandingPayload } from "../themes";
import { scoreBranding, type ScoreRow } from "./brandingScore";

/**
 * Smooth-scroll for in-page anchors so the user lands on the field they
 * need to fix instead of the top of the page (default browser jump
 * jolts past the section header on long forms).
 */
function jumpToAnchor(href: string) {
  if (!href.startsWith("#")) return false;
  const el = document.getElementById(href.slice(1));
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  // Brief outline pulse so the user sees where they landed.
  el.classList.add("ring-2", "ring-brand", "ring-offset-2");
  window.setTimeout(() => {
    el.classList.remove("ring-2", "ring-brand", "ring-offset-2");
  }, 1600);
  return true;
}

function ActionLink({ row }: { row: ScoreRow }) {
  if (!row.actionHref || !row.actionLabel) return null;
  const isAnchor = row.actionHref.startsWith("#");
  if (isAnchor) {
    return (
      <button
        type="button"
        onClick={() => jumpToAnchor(row.actionHref!)}
        className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-brand hover:underline"
      >
        {row.actionLabel}
        <ArrowRight className="h-3 w-3" />
      </button>
    );
  }
  return (
    <Link
      href={row.actionHref}
      className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-brand hover:underline"
    >
      {row.actionLabel}
      <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

export interface BrandingValidationCardProps {
  branding: BrandingPayload | undefined;
}

/**
 * Per-field validation + completeness score for the public branding
 * payload. Same shape the iframe hydrator consumes — single source of
 * truth. Scoring math lives in `brandingScore.ts` and is unit-tested.
 *
 * Templates differ in which sections they actually render (v3 has
 * education, v1/v2 currently don't), but the underlying payload is
 * shared — so the score reflects what visitors COULD see across all
 * templates, and we still surface the recommendation even if the
 * active template doesn't have a slot for it.
 */
export function BrandingValidationCard({
  branding,
}: BrandingValidationCardProps) {
  if (!branding) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle as="h3" className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-muted-foreground" />
            Validasi Data Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Memuat data…</p>
        </CardContent>
      </Card>
    );
  }

  const { rows, score, grade, requiredMissing } = scoreBranding(branding);
  const gradeColor =
    score >= 75
      ? "text-emerald-600 dark:text-emerald-400"
      : score >= 60
        ? "text-amber-600 dark:text-amber-400"
        : "text-rose-600 dark:text-rose-400";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle as="h3" className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-brand" />
              Validasi & Skor Kelengkapan
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Skor dipakai bersama untuk semua template (Purple Glass,
              Editorial Cream, Premium Dark). Ikuti rekomendasi untuk
              memaksimalkan kesan profesional.
            </p>
          </div>
          <div className="text-right">
            <div className={cn("text-3xl font-bold leading-none", gradeColor)}>
              {grade}
            </div>
            <div className="text-xs text-muted-foreground">{score}/100</div>
          </div>
        </div>
        <Progress value={score} className="mt-3 h-2" />
        {requiredMissing.length > 0 && (
          <div className="mt-3 space-y-1.5 rounded-md border border-amber-500/40 bg-amber-50/50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div>
                <strong>{requiredMissing.length} field wajib</strong> belum
                terpenuhi — klik untuk langsung ke field-nya.
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pl-5">
              {requiredMissing.map((r) =>
                r.actionHref ? (
                  r.actionHref.startsWith("#") ? (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => jumpToAnchor(r.actionHref!)}
                      className="rounded-full border border-amber-500/40 bg-background/60 px-2 py-0.5 font-medium hover:bg-background"
                    >
                      {r.label}
                    </button>
                  ) : (
                    <Link
                      key={r.key}
                      href={r.actionHref}
                      className="rounded-full border border-amber-500/40 bg-background/60 px-2 py-0.5 font-medium hover:bg-background"
                    >
                      {r.label}
                    </Link>
                  )
                ) : (
                  <span
                    key={r.key}
                    className="rounded-full border border-amber-500/40 bg-background/60 px-2 py-0.5"
                  >
                    {r.label}
                  </span>
                ),
              )}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {rows.map((r) => {
            const partial = r.earned > 0 && r.earned < r.weight;
            const tone = r.earned >= r.weight ? "ok" : partial ? "partial" : "miss";
            return (
              <li
                key={r.key}
                className={cn(
                  "flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-xs",
                  tone === "ok"
                    ? "border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20"
                    : tone === "partial"
                      ? "border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20"
                      : "border-border bg-muted/30",
                )}
              >
                {tone === "ok" ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle
                    className={cn(
                      "mt-0.5 h-3.5 w-3.5 shrink-0",
                      tone === "partial"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground",
                    )}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {r.label}
                      {r.severity === "required" && (
                        <Badge
                          variant="outline"
                          className="ml-1.5 h-4 border-rose-500/40 px-1 py-0 text-[8px] uppercase text-rose-600 dark:text-rose-400"
                        >
                          wajib
                        </Badge>
                      )}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 truncate text-[10px]",
                        tone === "ok"
                          ? "text-emerald-700 dark:text-emerald-300"
                          : tone === "partial"
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-muted-foreground",
                      )}
                    >
                      {r.detail} · {r.earned}/{r.weight} pt
                    </span>
                  </div>
                  {r.hint && (
                    <p
                      className={cn(
                        "text-[10px]",
                        tone === "miss"
                          ? "text-muted-foreground"
                          : "text-amber-700 dark:text-amber-300",
                      )}
                    >
                      💡 {r.hint}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/70">
                    Sumber: {r.source}
                  </p>
                  {tone !== "ok" && <ActionLink row={r} />}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
