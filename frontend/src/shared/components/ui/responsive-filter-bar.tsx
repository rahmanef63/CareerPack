"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";

import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/shared/components/ui/drawer";

/**
 * Responsive Filter Bar.
 *
 * Desktop (≥lg): children render inline as a horizontal chip/button row.
 * Mobile (<lg): single "Filter" button (with active-count badge) opens a
 * Drawer containing the same children vertically.
 *
 * Consumer passes the same filter controls (e.g. ResponsiveSelect chips,
 * toggle buttons) as children; the primitive only handles the container +
 * mobile trigger.
 */

export interface ResponsiveFilterBarProps {
  children: React.ReactNode;
  /** Active filter count shown on the mobile trigger badge. */
  activeCount?: number;
  /** Drawer title + sr-only fallback. Default "Filter". */
  drawerTitle?: string;
  /** Mobile button label. Default "Filter". */
  triggerLabel?: string;
  /** Optional "Reset" callback — renders a footer button inside Drawer when provided. */
  onReset?: () => void;
  resetLabel?: string;
  applyLabel?: string;
  /** Class for desktop inline row / mobile trigger container. */
  className?: string;
  /** Class for the Drawer content wrapper (mobile). */
  drawerClassName?: string;
  /** Stack children vertically inside the Drawer. Default true. */
  stackInDrawer?: boolean;
}

export function ResponsiveFilterBar({
  children,
  activeCount = 0,
  drawerTitle = "Filter",
  triggerLabel = "Filter",
  onReset,
  resetLabel = "Reset",
  applyLabel = "Terapkan",
  className,
  drawerClassName,
  stackInDrawer = true,
}: ResponsiveFilterBarProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  if (!isMobile) {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          className,
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={className}>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            {triggerLabel}
            {activeCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-xs"
              >
                {activeCount}
              </Badge>
            )}
          </Button>
        </DrawerTrigger>
        <DrawerContent className={cn("max-h-[90vh]", drawerClassName)}>
          <DrawerHeader>
            <DrawerTitle>{drawerTitle}</DrawerTitle>
          </DrawerHeader>
          <div
            className={cn(
              "overflow-y-auto px-4 pb-2",
              stackInDrawer ? "flex flex-col gap-4" : "flex flex-wrap gap-2",
            )}
          >
            {children}
          </div>
          <DrawerFooter className="flex-row">
            {onReset && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  onReset();
                }}
              >
                {resetLabel}
              </Button>
            )}
            <DrawerClose asChild>
              <Button type="button" className="flex-1">
                {applyLabel}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
