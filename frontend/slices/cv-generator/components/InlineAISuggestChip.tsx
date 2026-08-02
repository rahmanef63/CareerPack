"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface InlineAISuggestChipProps {
  label: string;
  onClick: () => void;
  className?: string;
}

export function InlineAISuggestChip({ label, onClick, className }: InlineAISuggestChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
        "bg-gradient-to-r from-brand-muted to-brand-to/60 text-brand",
        "dark:from-brand-from/40 dark:to-brand-to/40 dark:text-brand",
        "hover:from-brand-from hover:to-brand-to dark:hover:from-brand-from/60 dark:hover:to-brand-to/60",
        "tap-press transition-colors",
        className
      )}
    >
      <Sparkles className="w-3 h-3" />
      {label}
    </button>
  );
}
