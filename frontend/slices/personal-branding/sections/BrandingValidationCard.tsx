"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, CheckCircle2, AlertCircle, ChevronDown, Info, PartyPopper, Sparkles,
} from "lucide-react";
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
import { GRADE_LABEL, scoreBranding, type ScoreRow } from "./brandingScore";

/**
 * Smooth-scroll for in-page anchors so the user lands on the field
 * they need to fix instead of the top of the page. Also dispatches
 * a `pb-jump` CustomEvent so the parent view can open the matching
 * accordion section before scrolling — otherwise the anchor target
 * sits inside a collapsed accordion and the user can't see it.
 */
function jumpToAnchor(href: string) {
  if (!href.startsWith("#")) return false;
  const id = href.slice(1);
  // Strip the "pb-section-" prefix so the parent accordion can match
  // its short section ids ("identity", "contact", etc.).
  const sectionKey = id.startsWith("pb-section-")
    ? id.slice("pb-section-".length)
    : id;
  window.dispatchEvent(
    new CustomEvent("pb-jump", { detail: { sectionKey } }),
  );
  // Slight delay lets the accordion expand before we scroll/measure.
  window.setTimeout(() => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("ring-2", "ring-brand", "ring-offset-2");
    window.setTimeout(() => {
      el.classList.remove("ring-2", "ring-brand", "ring-offset-2");
    }, 1600);
  }, 80);
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
        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
      >
        {row.actionLabel}
        <ArrowRight className="h-3 w-3" />
      </button>
    );
  }
  return (
    <Link
      href={row.actionHref}
      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
    >
      {row.actionLabel}
      <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

/** The one thing to do next, as a button sized to be the obvious target. */
function NextStepAction({ row }: { row: ScoreRow }) {
  const label = row.actionLabel ?? "Perbaiki";
  const cls =
    "inline-flex shrink-0 items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground hover:opacity-90";
  if (!row.actionHref) return null;
  return row.actionHref.startsWith("#") ? (
    <button type="button" onClick={() => jumpToAnchor(row.actionHref!)} className={cls}>
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </button>
  ) : (
    <Link href={row.actionHref} className={cls}>
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
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
  // Above the early return: hooks must run in the same order on every render,
  // and `branding` is undefined for the first paint while the queries resolve.
  const [showAll, setShowAll] = useState(false);

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

  const { rows, score, grade } = scoreBranding(branding);
  const done = rows.filter((r) => r.earned >= r.weight);
  const todo = rows.filter((r) => r.earned < r.weight);
  // `rows` is already ordered required -> recommended -> optional, so the first
  // unfinished row IS the most important one. Showing one at a time is the
  // whole point: the old card listed all 14 gaps at once with weights and a
  // letter grade, which reads as a report card. A beginner does not need to be
  // told everything that is wrong simultaneously — they need to know what to
  // do next.
  const next = todo[0];
  const pct = rows.length > 0 ? Math.round((done.length / rows.length) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle as="h3" className="flex items-center gap-2 text-base">
            {todo.length === 0 ? (
              <PartyPopper className="h-4 w-4 text-success" />
            ) : (
              <Sparkles className="h-4 w-4 text-brand" />
            )}
            {todo.length === 0
              ? "Halaman kamu sudah lengkap"
              : `Halaman kamu ${done.length}/${rows.length} siap`}
          </CardTitle>
          <span
            className="shrink-0 text-xs text-muted-foreground"
            title={`Skor ${score}/100 — tier ${grade} (${GRADE_LABEL[grade]})`}
          >
            {score}/100
          </span>
        </div>
        <Progress
          value={pct}
          aria-label="Kelengkapan personal branding"
          aria-valuetext={`${pct}% lengkap`}
          className="mt-3 h-2"
        />

        {next ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-brand/30 bg-brand-muted/40 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Berikutnya
              </p>
              <p className="truncate text-sm font-medium text-foreground">
                {next.label}
              </p>
              {next.hint && (
                <p className="truncate text-xs text-muted-foreground">
                  {next.hint}
                </p>
              )}
            </div>
            <NextStepAction row={next} />
          </div>
        ) : (
          <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success-text">
            Semua bagian terisi. Tinggal publikasikan kalau belum.
          </p>
        )}

        {todo.length > 1 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            aria-expanded={showAll}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {showAll ? "Sembunyikan" : `Lihat semua (${todo.length - 1} lagi)`}
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", showAll && "rotate-180")}
            />
          </button>
        )}
      </CardHeader>
      {showAll && (
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
                    ? "border-success/30 bg-success/10"
                    : tone === "partial"
                      ? "border-warning/30 bg-warning/10"
                      : "border-border bg-muted/30",
                )}
              >
                {tone === "ok" ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                ) : (
                  <AlertCircle
                    className={cn(
                      "mt-0.5 h-3.5 w-3.5 shrink-0",
                      tone === "partial"
                        ? "text-warning-text"
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
                          className="ml-1.5 h-5 border-destructive/40 px-1.5 py-0 text-xs uppercase leading-none text-destructive"
                        >
                          wajib
                        </Badge>
                      )}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 truncate text-xs",
                        tone === "ok"
                          ? "text-success-text"
                          : tone === "partial"
                            ? "text-warning-text"
                            : "text-muted-foreground",
                      )}
                    >
                      {r.detail} · {r.earned}/{r.weight} pt
                    </span>
                  </div>
                  {r.hint && (
                    <p
                      className={cn(
                        "text-xs",
                        tone === "miss"
                          ? "text-muted-foreground"
                          : "text-warning-text",
                      )}
                    >
                      💡 {r.hint}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground/70">
                    Sumber: {r.source}
                  </p>
                  {tone !== "ok" && <ActionLink row={r} />}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
      )}
    </Card>
  );
}
