"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/shared/lib/utils"
import { Button, buttonVariants } from "@/shared/components/ui/button"

type CalendarClassNames = NonNullable<
  React.ComponentProps<typeof DayPicker>["classNames"]
>

/**
 * Merge a caller's override map over ours, ignoring keys explicitly set to
 * `undefined`.
 *
 * Callers spell "no override for this slot" as `{ weekdays: undefined }`
 * (UltimateCalendar does exactly that). A plain object spread lets that
 * `undefined` WIN and erase our default class — which is how the weekday
 * header row ended up with no classes at all, fell back to plain
 * `table-row` / `table-cell` layout, and stopped lining up with the day
 * columns underneath it.
 */
function mergeClassNames(
  base: CalendarClassNames,
  override: CalendarClassNames | undefined
): CalendarClassNames {
  const merged: CalendarClassNames = { ...base }
  for (const [key, value] of Object.entries(override ?? {})) {
    if (value === undefined) continue
    merged[key as keyof CalendarClassNames] = value
  }
  return merged
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  // react-day-picker v9 renders the grid as a real `<table>`:
  //   month_grid → <table>   weekdays → <tr>   weekday  → <th>
  //   weeks      → <tbody>   week     → <tr>   day      → <td>
  // so every class below has to be a *table* utility. Flex utilities on
  // `weekdays` / `week` / `weekday` are inert on table boxes (`flex-1` in
  // particular did nothing), which left auto table layout to hand the first
  // weekday cell all the slack — the "Sen … Sel Rab Kam" header bug.
  // Equal columns now come from `w-[--cell-size]` on every header cell plus
  // `w-full` on the table: at the natural size that is 7 × cell-size, and any
  // extra width is distributed evenly. Row rhythm is `border-spacing-y`
  // (margins do not apply to `<tr>`).
  // NOTE: there is no `table` slot in v9 — it was renamed `month_grid`, and a
  // `table:` key is silently dropped.
  const baseClassNames: CalendarClassNames = {
    root: cn("w-fit", defaultClassNames.root),
    months: cn(
      "relative flex flex-col gap-4 md:flex-row",
      defaultClassNames.months
    ),
    month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
    nav: cn(
      "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
      defaultClassNames.nav
    ),
    button_previous: cn(
      buttonVariants({ variant: buttonVariant }),
      "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50",
      defaultClassNames.button_previous
    ),
    button_next: cn(
      buttonVariants({ variant: buttonVariant }),
      "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50",
      defaultClassNames.button_next
    ),
    month_caption: cn(
      "flex h-[--cell-size] w-full items-center justify-center px-[--cell-size]",
      defaultClassNames.month_caption
    ),
    dropdowns: cn(
      "flex h-[--cell-size] w-full items-center justify-center gap-1.5 text-sm font-medium",
      defaultClassNames.dropdowns
    ),
    dropdown_root: cn(
      "has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border",
      defaultClassNames.dropdown_root
    ),
    dropdown: cn(
      "bg-popover absolute inset-0 opacity-0",
      defaultClassNames.dropdown
    ),
    caption_label: cn(
      "select-none font-medium",
      captionLayout === "label"
        ? "text-sm"
        : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
      defaultClassNames.caption_label
    ),
    month_grid: cn(
      "w-full border-separate border-spacing-x-0 border-spacing-y-1",
      defaultClassNames.month_grid
    ),
    weekdays: cn(defaultClassNames.weekdays),
    weekday: cn(
      "text-muted-foreground w-[--cell-size] select-none pb-1 align-bottom text-xs font-normal",
      defaultClassNames.weekday
    ),
    week: cn(defaultClassNames.week),
    week_number_header: cn(
      "w-[--cell-size] select-none",
      defaultClassNames.week_number_header
    ),
    week_number: cn(
      "text-muted-foreground select-none text-center text-xs",
      defaultClassNames.week_number
    ),
    day: cn(
      "group/day relative w-[--cell-size] select-none p-0 text-center align-middle [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md",
      defaultClassNames.day
    ),
    range_start: cn("bg-accent rounded-l-md", defaultClassNames.range_start),
    range_middle: cn("rounded-none", defaultClassNames.range_middle),
    range_end: cn("bg-accent rounded-r-md", defaultClassNames.range_end),
    today: cn(
      "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
      defaultClassNames.today
    ),
    outside: cn(
      "text-muted-foreground aria-selected:text-muted-foreground",
      defaultClassNames.outside
    ),
    disabled: cn(
      "text-muted-foreground opacity-50",
      defaultClassNames.disabled
    ),
    hidden: cn("invisible", defaultClassNames.hidden),
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={mergeClassNames(baseClassNames, classNames)}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-[--cell-size] items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 flex aspect-square h-auto w-full min-w-[--cell-size] flex-col gap-1 font-normal leading-none data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
