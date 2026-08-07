"use client";

import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import type { Conflict, Side } from "@/shared/lib/cv-merge";

import { ConflictCard } from "./ConflictCard";

/**
 * Screen ④, in three pieces because the sticky regions are props of
 * `ResponsiveDialogContent` and that element belongs to `CVImportDialog`.
 * Header and footer stay pinned so the pager never scrolls away on a phone.
 */

export function ConflictPagerHeader({
  conflict,
  idx,
  total,
}: {
  conflict: Conflict;
  idx: number;
  total: number;
}) {
  return (
    <>
      {/* Progress renders translateX(-${100 - value}%) — at total 0 the
          expression is NaN and the bar paints itself completely full. */}
      <Progress value={total > 0 ? ((idx + 1) / total) * 100 : 0} className="h-1.5" />
      <div className="mt-2 flex items-center justify-between gap-2">
        <Badge variant="outline">{conflict.group}</Badge>
        <span className="text-xs tabular-nums text-muted-foreground">
          Perbedaan {idx + 1} dari {total}
        </span>
      </div>
    </>
  );
}

export function ConflictPager({
  conflict,
  decision,
  onChoose,
}: {
  conflict: Conflict;
  decision: Side | undefined;
  onChoose: (id: string, side: Side) => void;
}) {
  return (
    <div className="space-y-4">
      <ConflictCard conflict={conflict} decision={decision} onChoose={onChoose} />
      <p className="text-xs leading-relaxed text-muted-foreground">
        Yang tidak kamu putuskan tetap memakai nilai kamu sekarang, jadi berhenti
        di tengah pun aman.
      </p>
    </div>
  );
}

export function ConflictPagerFooter({
  idx,
  total,
  applyCount,
  applying,
  onPrev,
  onNext,
  onFinish,
  onApply,
}: {
  idx: number;
  total: number;
  /** Additions + auto-merges + the differences resolved to the CV's value. */
  applyCount: number;
  applying: boolean;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
  onApply: () => void;
}) {
  const isLast = idx >= total - 1;
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center justify-center gap-2 sm:justify-start">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9"
          aria-label="Perbedaan sebelumnya"
          disabled={idx === 0}
          onClick={onPrev}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-10 text-center text-xs tabular-nums text-muted-foreground">
          {idx + 1}/{total}
        </span>
        {isLast ? (
          <Button type="button" variant="outline" className="h-9 gap-2" onClick={onFinish}>
            <Check className="h-4 w-4" />
            Selesai
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            aria-label="Perbedaan berikutnya"
            onClick={onNext}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Button
        type="button"
        className="gap-2 bg-brand hover:bg-brand"
        disabled={applying}
        onClick={onApply}
      >
        {applying && <Loader2 className="h-4 w-4 animate-spin" />}
        Terapkan {applyCount} perubahan
      </Button>
    </div>
  );
}
