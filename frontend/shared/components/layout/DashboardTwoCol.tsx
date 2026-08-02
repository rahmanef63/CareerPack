import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

/**
 * Opt-in two-column dashboard layout with a right rail.
 *
 * Desktop (≥lg): main content on the left takes remaining width;
 * rail is a fixed-ish 320px column on the right.
 * Below lg: rail stacks below main, full-width (compact ordering
 * via a single column — no reflow needed since grid auto-rows).
 *
 * `minmax(0,1fr)` on the main column is critical — without it, any
 * wide child (chart, table, code block) can push the grid beyond
 * viewport and break the rail width.
 *
 * Pure presentation. No state. Safe to use inside any slice.
 */
export interface DashboardTwoColProps {
  children: ReactNode;
  rail: ReactNode;
  /** Aria-label for the rail <aside>. */
  railLabel?: string;
  className?: string;
}

export function DashboardTwoCol({
  children,
  rail,
  railLabel = "Panel samping",
  className,
}: DashboardTwoColProps) {
  return (
    <div
      className={cn(
        "grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]",
        className,
      )}
    >
      <div className="min-w-0 space-y-6">{children}</div>
      <aside
        aria-label={railLabel}
        className="space-y-4 lg:sticky lg:top-4 lg:self-start"
      >
        {rail}
      </aside>
    </div>
  );
}
