"use client";

import * as React from "react";

import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";

/**
 * Responsive Tooltip.
 *
 * Desktop (≥lg): Radix Tooltip — hover-triggered, non-modal.
 * Mobile (<lg): Radix Popover — tap-triggered, dismiss-on-outside.
 *
 * Rationale: touch devices don't have hover. A "tooltip" that never shows
 * on mobile is dead UI. We downgrade to a small Popover so the hint text
 * is still reachable.
 *
 * TooltipProvider must be mounted upstream (wired di Providers.tsx).
 */

type Mode = "tooltip" | "popover";

const ModeContext = React.createContext<Mode>("tooltip");
function useMode(): Mode {
  return React.useContext(ModeContext);
}

export interface ResponsiveTooltipProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  /** Tooltip-only: delay before showing on hover (ms). Default Radix default. */
  delayDuration?: number;
  forceMode?: Mode;
}

export function ResponsiveTooltip({
  open,
  onOpenChange,
  children,
  delayDuration,
  forceMode,
}: ResponsiveTooltipProps) {
  const isMobile = useIsMobile();
  const mode: Mode = forceMode ?? (isMobile ? "popover" : "tooltip");

  if (mode === "tooltip") {
    return (
      <ModeContext.Provider value="tooltip">
        <Tooltip
          open={open}
          onOpenChange={onOpenChange}
          delayDuration={delayDuration}
        >
          {children}
        </Tooltip>
      </ModeContext.Provider>
    );
  }
  return (
    <ModeContext.Provider value="popover">
      <Popover open={open} onOpenChange={onOpenChange}>
        {children}
      </Popover>
    </ModeContext.Provider>
  );
}

export function ResponsiveTooltipTrigger(
  props: React.ComponentProps<typeof TooltipTrigger>,
) {
  const mode = useMode();
  const Trigger = mode === "tooltip" ? TooltipTrigger : PopoverTrigger;
  return <Trigger {...props} />;
}

export interface ResponsiveTooltipContentProps
  extends React.ComponentProps<typeof TooltipContent> {
  /** Extra class for mobile Popover variant. */
  popoverClassName?: string;
}

export function ResponsiveTooltipContent({
  className,
  popoverClassName,
  children,
  sideOffset,
  ...props
}: ResponsiveTooltipContentProps) {
  const mode = useMode();
  if (mode === "tooltip") {
    return (
      <TooltipContent sideOffset={sideOffset} className={className} {...props}>
        {children}
      </TooltipContent>
    );
  }
  // On mobile treat as a small popover; no dark primary bg — lighter style
  // so it reads like a hint rather than a full dialog.
  return (
    <PopoverContent
      sideOffset={sideOffset}
      className={cn(
        "w-auto max-w-[80vw] px-3 py-2 text-xs",
        popoverClassName,
      )}
    >
      {children}
    </PopoverContent>
  );
}
