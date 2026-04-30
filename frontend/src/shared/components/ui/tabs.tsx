"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/shared/lib/utils"

const Tabs = TabsPrimitive.Root

/**
 * Shared tab layouts. Use `variant` — not bespoke className overrides —
 * so every slice stays consistent:
 *
 * - `pills` (default): scroll-aware horizontal row. Width fits content,
 *   with `overflow-x-auto` + hidden scrollbar when children overflow.
 *   Suited for dynamic-count tabs with badges (Semua/Unread/Important).
 * - `equal`: grid, each trigger takes `100/count`% of the list. Fills
 *   container width; still horizontally scrolls if triggers overflow.
 *   Suited for fixed-count tabs (Mode Latihan / Bank Soal).
 * - `segmented`: like `pills` but with elevated active-tab pill and a
 *   subtle container border. Compact iOS-style segmented control.
 *
 * Pass `cols` alongside `variant="equal"` when the count is known at
 * render-time (e.g. `cols={2}`). Omitting it falls back to
 * `auto-cols-fr` (sizes per count at runtime).
 */
export type TabsListVariant = "pills" | "equal" | "segmented"

type TabsListBaseProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>

export interface TabsListProps extends TabsListBaseProps {
  variant?: TabsListVariant
  /** Only meaningful with `variant="equal"`. 2..6 supported via tailwind grid-cols-*. */
  cols?: 2 | 3 | 4 | 5 | 6
}

const EQUAL_COLS_CLASS: Record<NonNullable<TabsListProps["cols"]>, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
}

const VARIANT_LIST_CLASS: Record<TabsListVariant, string> = {
  // Note: no `items-center` on any variant — children should stretch to
  // fill the list height so the full list area (h-11 mobile / h-9 desktop
  // per TabsList) becomes the touch target, not just the trigger content.
  //
  // All variants are `flex w-full justify-evenly` so triggers spread to
  // fill the container when they fit. When the total trigger width
  // exceeds the container (mobile, many triggers), `overflow-x-auto`
  // turns it into a horizontal scroll row — `flex-shrink-0` on the
  // trigger (in TabsTrigger below) keeps each trigger at its content
  // width so text never gets squished.
  pills:
    "flex w-full items-stretch justify-evenly gap-1 overflow-x-auto rounded-lg bg-muted p-1 text-muted-foreground " +
    "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
  equal:
    // Grid fills container; each trigger = fr. Auto-cols-fr used when no
    // `cols` prop supplied. Still scrollable if total min-width exceeds viewport.
    "grid w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1 text-muted-foreground " +
    "auto-cols-fr [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
  segmented:
    "flex w-full items-stretch justify-evenly gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 text-muted-foreground shadow-sm " +
    "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = "pills", cols, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    data-variant={variant}
    className={cn(
      // WCAG 2.5.5 minimum 44×44 on mobile; compact 36px on sm+ for
      // information-dense desktop layouts.
      "h-11 sm:h-9",
      VARIANT_LIST_CLASS[variant],
      variant === "equal" && cols !== undefined && EQUAL_COLS_CLASS[cols],
      className,
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // `flex-shrink-0` keeps each trigger at its natural content width
      // so when a `pills`/`segmented` row overflows the container, it
      // scrolls horizontally instead of squishing the text. The `equal`
      // variant overrides this via grid sizing — but flex-shrink is
      // ignored on grid items, so it's safe as a default for all variants.
      "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      // In segmented parents, active pill becomes fully rounded.
      "group-data-[variant=segmented]:rounded-full",
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
