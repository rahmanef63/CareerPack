"use client";

import * as React from "react";

import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/shared/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";

/**
 * Responsive HoverCard.
 *
 * Desktop (≥lg): Radix HoverCard — hover-triggered rich preview.
 * Mobile (<lg): Radix Popover — tap-triggered (hover doesn't fire on
 * touch). Bigger than a Tooltip — suited for profile/entity previews.
 */

type Mode = "hover-card" | "popover";

const ModeContext = React.createContext<Mode>("hover-card");
function useMode(): Mode {
  return React.useContext(ModeContext);
}

export interface ResponsiveHoverCardProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  /** Desktop-only: delay before opening on hover (ms). Default Radix 700. */
  openDelay?: number;
  /** Desktop-only: delay before closing on mouseleave (ms). */
  closeDelay?: number;
  forceMode?: Mode;
}

export function ResponsiveHoverCard({
  open,
  onOpenChange,
  children,
  openDelay,
  closeDelay,
  forceMode,
}: ResponsiveHoverCardProps) {
  const isMobile = useIsMobile();
  const mode: Mode = forceMode ?? (isMobile ? "popover" : "hover-card");

  if (mode === "hover-card") {
    return (
      <ModeContext.Provider value="hover-card">
        <HoverCard
          open={open}
          onOpenChange={onOpenChange}
          openDelay={openDelay}
          closeDelay={closeDelay}
        >
          {children}
        </HoverCard>
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

export function ResponsiveHoverCardTrigger(
  props: React.ComponentProps<typeof HoverCardTrigger>,
) {
  const mode = useMode();
  if (mode === "hover-card") return <HoverCardTrigger {...props} />;
  return (
    <PopoverTrigger
      {...(props as React.ComponentProps<typeof PopoverTrigger>)}
    />
  );
}

export interface ResponsiveHoverCardContentProps
  extends React.ComponentProps<typeof HoverCardContent> {
  popoverClassName?: string;
}

export function ResponsiveHoverCardContent({
  className,
  popoverClassName,
  children,
  align,
  sideOffset,
  ...props
}: ResponsiveHoverCardContentProps) {
  const mode = useMode();
  if (mode === "hover-card") {
    return (
      <HoverCardContent
        align={align}
        sideOffset={sideOffset}
        className={className}
        {...props}
      >
        {children}
      </HoverCardContent>
    );
  }
  // Popover variant — default width 72 matches HoverCardContent visuals.
  return (
    <PopoverContent
      align={align}
      sideOffset={sideOffset}
      className={cn("w-72", popoverClassName)}
    >
      {children}
    </PopoverContent>
  );
}
