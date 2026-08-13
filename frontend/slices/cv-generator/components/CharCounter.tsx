"use client";

import { cn } from "@/shared/lib/utils";

interface Props {
  value: string;
  /** Soft target; we never hard-limit, just signal when the user is
   *  drifting past the recommended ceiling. */
  recommendedMax: number;
  className?: string;
}

/**
 * Live character counter for narrative fields (profile summary,
 * experience description). Soft-cap UX — at 80 % of the recommended
 * max we hint amber, past 100 % we go rose. Encourages tight copy
 * without forcing truncation that would lose user content.
 */
export function CharCounter({ value, recommendedMax, className }: Props) {
  const len = value.length;
  const ratio = recommendedMax > 0 ? len / recommendedMax : 0;
  const over = ratio >= 1;
  // warning-text (not warning) is the token meant for prose — plain
  // --warning is the bright amber fill and fails contrast as body copy.
  const tone = over
    ? "text-destructive"
    : ratio >= 0.8
      ? "text-warning-text"
      : "text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs tabular-nums",
        tone,
        className,
      )}
      aria-live="polite"
      title={
        over
          ? `Lewat target ideal (${recommendedMax} karakter) — masih boleh, tapi tampilan bisa terpotong di template tertentu.`
          : undefined
      }
    >
      <span>
        {len}/{recommendedMax}
      </span>
      {over && (
        <span className="hidden font-normal sm:inline">
          · target ideal terlampaui
        </span>
      )}
    </span>
  );
}
