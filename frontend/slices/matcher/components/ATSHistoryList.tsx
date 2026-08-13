"use client";

import { useState } from "react";
import { History } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Badge } from "@/shared/components/ui/badge";
import { EmptyState } from "@/shared/components/feedback/EmptyState";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import { useATSHistory, useATSScan_byId } from "../hooks/useATSScan";
import { ATSResultCard } from "./ATSResultCard";

/** Mirrors ATSResultCard.gradeColor — same tokens, same D/F split. */
function gradeBadgeClass(grade: string): string {
  switch (grade) {
    case "A":
      return "bg-success/15 text-success-text";
    case "B":
      return "bg-info/15 text-info-text";
    case "C":
      return "bg-warning/15 text-warning-text";
    case "D":
      return "bg-destructive/10 text-destructive-text";
    case "F":
    default:
      return "bg-destructive/20 text-destructive-text";
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
      <div className="grid grid-cols-1 gap-2">
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
      // ponytail: icon only — NoResults art is already spent one tab over in JobResults.
      <EmptyState
        icon={History}
        title="Belum ada scan"
        description={"Lakukan scan pertama di tab “Cek ATS”."}
        className="rounded-xl border border-dashed border-border bg-card"
      />
    );
  }

  return (
    <>
      {/* `grid-cols-1` is explicit so the implicit track can't size to a
          long job title's max-content and take the page sideways. */}
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        {scans.map((s) => (
          <button
            key={s._id}
            type="button"
            onClick={() => setOpenId(s._id)}
            className="group flex w-full min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition hover:border-brand/40 hover:bg-accent/40"
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
