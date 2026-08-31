"use client";

import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface InlineAISuggestChipProps {
  label: string;
  onClick: () => void;
  className?: string;
  /** Disables the chip and swaps the icon for a spinner while the AI call
   *  is in flight — without this a fast second click fired a second quota
   *  slot before the first response landed. */
  loading?: boolean;
}

export function InlineAISuggestChip({ label, onClick, className, loading }: InlineAISuggestChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        "bg-gradient-to-r from-brand-muted to-brand-to/60 text-brand",
        "dark:from-brand-from/40 dark:to-brand-to/40 dark:text-brand",
        "hover:from-brand-from hover:to-brand-to dark:hover:from-brand-from/60 dark:hover:to-brand-to/60",
        "tap-press transition-colors disabled:cursor-not-allowed disabled:opacity-70",
        className
      )}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
      {label}
    </button>
  );
}
