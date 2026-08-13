"use client";

import { useId } from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { cn } from "@/shared/lib/utils";
import type { ChecklistProgress } from "../../hooks/useChecklistData";

/**
 * Overall progress for one checklist tab.
 *
 * Was a full-width 4-up stat grid stacked on top of the page; it now
 * lives in the desktop rail beside the document list and stacks only on
 * mobile. Four cards became one card so the rail stays readable.
 *
 * a11y — the bare `<Progress value>` had no accessible name at all
 * (axe `aria-progressbar-name`). It is now named by the visible heading
 * via `aria-labelledby`, and `aria-valuetext` spells the value out
 * instead of leaving a screen reader to announce a bare percentage.
 * Note `percentage` is computed off *required* documents in
 * `getProgress`, so the value text says "wajib" — the data model is
 * untouched, the announcement just stops overstating what it measures.
 */
export function ProgressSummary({ progress }: { progress: ChecklistProgress }) {
  const headingId = useId();
  const remaining = progress.total - progress.completed;
  const requiredLeft = progress.required - progress.requiredCompleted;

  return (
    <Card className="border-border">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2
              id={headingId}
              className="text-sm font-medium text-muted-foreground"
            >
              Progress Keseluruhan
            </h2>
            <p className="text-3xl font-bold leading-tight text-brand">
              {progress.percentage}%
            </p>
          </div>
          <p className="text-xs text-right text-muted-foreground">
            {progress.requiredCompleted}/{progress.required}
            <br />
            dokumen wajib
          </p>
        </div>

        <Progress
          value={progress.percentage}
          className="h-2"
          aria-labelledby={headingId}
          aria-valuetext={`${progress.requiredCompleted} dari ${progress.required} dokumen wajib selesai`}
        />

        <dl className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Selesai" value={progress.completed} tone="text-success-text" />
          <Stat label="Belum" value={remaining} tone="text-warning-text" />
          <Stat label="Wajib Sisa" value={requiredLeft} tone="text-destructive-text" />
        </dl>
      </CardContent>
    </Card>
  );
}

function Stat({
  label, value, tone,
}: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-2 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("text-xl font-bold", tone)}>{value}</dd>
    </div>
  );
}
