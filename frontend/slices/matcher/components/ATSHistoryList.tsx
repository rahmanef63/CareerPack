"use client";

import { useState } from "react";
import { History } from "lucide-react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Badge } from "@/shared/components/ui/badge";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import { useATSHistory, useATSScan_byId } from "../hooks/useATSScan";
import { ATSResultCard } from "./ATSResultCard";

function gradeBadgeClass(grade: string): string {
  switch (grade) {
    case "A":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "B":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
    case "C":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "D":
      return "bg-orange-500/15 text-orange-700 dark:text-orange-300";
    case "F":
    default:
      return "bg-rose-500/15 text-rose-700 dark:text-rose-300";
  }
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ATSHistoryList() {
  const { scans, isLoading } = useATSHistory();
  const [openId, setOpenId] = useState<Id<"atsScans"> | null>(null);
  const { scan: detail } = useATSScan_byId(openId);

  if (isLoading) {
    return (
      <div className="grid gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl border border-border bg-muted/30"
          />
        ))}
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <History className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Belum ada scan</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Lakukan scan pertama di tab &ldquo;Cek ATS&rdquo;.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {scans.map((s) => (
          <button
            key={s._id}
            type="button"
            onClick={() => setOpenId(s._id)}
            className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition hover:border-brand/40 hover:bg-accent/40"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${gradeBadgeClass(s.grade)}`}
            >
              {s.score}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{s.jobTitle}</p>
              {s.jobCompany && (
                <p className="truncate text-xs text-muted-foreground">{s.jobCompany}</p>
              )}
            </div>
            <Badge variant="outline" className="shrink-0">
              {formatDate(s.createdAt)}
            </Badge>
          </button>
        ))}
      </div>

      <ResponsiveDialog
        open={!!openId}
        onOpenChange={(o) => !o && setOpenId(null)}
      >
        <ResponsiveDialogContent size="2xl" aria-describedby={undefined}>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Hasil Scan</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          {detail && (
            <ATSResultCard
              score={detail.score}
              grade={detail.grade}
              breakdown={detail.breakdown}
              matchedKeywords={detail.matchedKeywords}
              missingKeywords={detail.missingKeywords}
              formatIssues={detail.formatIssues}
              recommendations={detail.recommendations}
              jobTitle={detail.jobTitle}
              jobCompany={detail.jobCompany ?? undefined}
            />
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
