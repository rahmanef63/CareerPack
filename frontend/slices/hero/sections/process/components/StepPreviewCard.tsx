import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

interface StepPreviewCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Shared mock-UI card shell reused by all 4 step previews so each preview
 * only needs to supply its step-specific content, not re-declare the
 * surface/border/shadow/padding treatment.
 */
export function StepPreviewCard({ children, className }: StepPreviewCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-landing-line bg-landing-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
}
