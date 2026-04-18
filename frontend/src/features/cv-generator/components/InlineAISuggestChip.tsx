"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
        "bg-gradient-to-r from-career-100 to-indigo-100 text-career-700",
        "dark:from-career-900/40 dark:to-indigo-900/40 dark:text-career-200",
        "hover:from-career-200 hover:to-indigo-200 dark:hover:from-career-800/60 dark:hover:to-indigo-800/60",
        "tap-press transition-colors",
        className
      )}
    >
      <Sparkles className="w-3 h-3" />
      {label}
    </button>
  );
}
