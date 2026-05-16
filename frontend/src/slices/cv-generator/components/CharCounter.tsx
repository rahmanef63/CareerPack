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
  const tone =
    ratio >= 1
      ? "text-rose-600 dark:text-rose-400"
      : ratio >= 0.8
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";
  return (
    <span
      className={cn(
        "text-[10px] tabular-nums",
        tone,
        className,
      )}
      aria-live="polite"
    >
      {len}/{recommendedMax}
    </span>
  );
}
