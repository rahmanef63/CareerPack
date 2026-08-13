import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export interface CalculatorSplitProps {
  /** Left column — the inputs the user manipulates. */
  children: ReactNode;
  /** Right rail — results derived from those inputs. */
  rail: ReactNode;
  /** Accessible name for the rail `<aside>`. */
  railLabel: string;
  className?: string;
}

/**
 * Two-column calculator layout: inputs left, results right, both on
 * screen at once so changing a number shows its effect without
 * scrolling.
 *
 * Below `lg` this is a plain single column — inputs first, results
 * underneath — i.e. exactly the previous mobile behaviour.
 *
 * At `lg` the rail sticks. `self-start` keeps the sticky box at its
 * content height while the grid area spans the (taller) input column,
 * which is what gives it room to travel. `top-[4.5rem]` clears the
 * sticky `SiteHeader` (h-14) plus the shell's `p-4` gutter — the
 * shared `DashboardTwoCol` sticks at `top-4`, which slides under that
 * header. The max-height keeps a rail taller than the viewport
 * reachable instead of clipping its bottom off-screen.
 */
export function CalculatorSplit({
  children,
  rail,
  railLabel,
  className,
}: CalculatorSplitProps) {
  return (
    <div
      className={cn(
        // minmax(0,1fr) on the input column is what stops a wide child
        // (chart, long label) from pushing the rail off its track.
        "grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_24rem]",
        className,
      )}
    >
      <div className="min-w-0 space-y-6">{children}</div>
      <aside
        aria-label={railLabel}
        // A region that scrolls but takes no focus cannot be scrolled by
        // keyboard at all (axe `scrollable-region-focusable`). tabIndex 0 gives
        // it a tab stop so arrow keys reach the content below the fold; the
        // aria-label above is what makes that stop announce itself.
        tabIndex={0}
        className={cn(
          "min-w-0 space-y-6",
          "lg:sticky lg:top-[4.5rem] lg:self-start lg:pb-1",
          "lg:max-h-[calc(100vh_-_6rem)] lg:overflow-y-auto lg:overscroll-contain",
        )}
      >
        {rail}
      </aside>
    </div>
  );
}
