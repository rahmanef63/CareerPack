"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHapticPress } from "./MicroInteractions";

interface AIFabProps {
  onClick: () => void;
  active?: boolean;
}

export function AIFab({ onClick, active }: AIFabProps) {
  const press = useHapticPress();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Buka AI Agent"
      className={cn(
        "relative w-16 h-16 rounded-full flex items-center justify-center text-white",
        "ring-4 ring-background",
        active ? "scale-95" : "animate-pulse-ai"
      )}
      {...press}
    >
      <span className="ai-fab-bg absolute inset-0 rounded-full" aria-hidden />
      <Sparkles className="w-7 h-7 relative z-10 drop-shadow" />
    </button>
  );
}
