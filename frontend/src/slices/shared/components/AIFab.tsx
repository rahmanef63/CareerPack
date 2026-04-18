"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHapticPress } from "./MicroInteractions";

interface AIFabProps {
  onClick: () => void;
  active?: boolean;
}

/**
 * Center-mounted FAB. Sits inside the BottomNav's center slot and
 * floats slightly above the nav bar. The visual variant (solid /
 * gradient / glow) is driven by `[data-ai-btn]` on <html> via UIPrefs.
 */
export function AIFab({ onClick, active }: AIFabProps) {
  const press = useHapticPress();
  return (
    <div className="relative flex flex-col items-center">
      <button
        type="button"
        onClick={onClick}
        aria-label="Buka Asisten AI"
        className={cn(
          "relative w-14 h-14 rounded-full flex items-center justify-center text-white",
          "ring-4 ring-background",
          active ? "scale-95" : "animate-pulse-ai"
        )}
        {...press}
      >
        <span className="ai-fab-bg absolute inset-0 rounded-full" aria-hidden />
        {/* Sparkle pulse ring — sits just outside the button border */}
        <span aria-hidden className="ai-fab-ring absolute -inset-1 rounded-full pointer-events-none" />
        <Sparkles className="w-6 h-6 relative z-10 drop-shadow" />
      </button>
      <span
        className={cn(
          "absolute -bottom-3 text-[10px] font-bold tracking-wide pointer-events-none",
          active ? "text-indigo-600 dark:text-indigo-300" : "text-slate-500 dark:text-slate-400"
        )}
      >
        AI
      </span>
    </div>
  );
}
