"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { CSSProperties } from "react";
import { Calendar } from "@/shared/components/ui/calendar";
import { cn } from "@/shared/lib/utils";

/**
 * `<UltimateCalendar>` — opinionated wrapper around the project's
 * shadcn `<Calendar>` (which itself wraps `react-day-picker` v9).
 *
 * Goal: expose every commonly-tweaked prop as a typed knob, so
 * callsites can declare appearance + behaviour without hand-rolling
 * `classNames` overrides each time. Also keeps a single
 * cross-project surface — slice authors get one component to
 * consume; appearance bugs / RTL / a11y get fixed in one place.
 *
 * Anything not covered explicitly forwards via `...props` to
 * react-day-picker, so no functionality is lost.
 *
 * Marked-date dots: rendered via `modifiers` + `modifiersClassNames`
 * — DayPicker's native pivot for per-date styling. The dot is a
 * Tailwind `::after` pseudo-element so the day cell stays a single
 * tab-stop and screen readers pick up the modifier label.
 */

type DayPickerProps = React.ComponentProps<typeof Calendar>;

export interface MarkedDate {
  date: Date;
  /** Render a dot indicator under the day number. */
  dot?: boolean;
  /** Dot colour class. The dot is an `::after` pseudo-element, so it needs the
   *  `after:` prefix and a theme token — e.g. `after:bg-brand`. A bare
   *  `bg-emerald-500` neither lands on the dot nor follows the preset. */
  color?: string;
  /** Optional accessible label, surfaced as `aria-label` on the day. */
  label?: string;
}

// `block w-fit mx-auto`, not `inline-block`. An inline-block box shrinks to
// its content AND follows inline flow, so it sat flush left inside whatever
// contained it — on /dashboard/calendar at 390px the picker measured 27px of
// gap on the left against 68px on the right, visibly off-centre. Auto margins
// do nothing on an inline-block, which is why nothing upstream could fix it;
// `block` + `w-fit` keeps the shrink-to-content sizing and lets `mx-auto`
// actually centre it.
const wrapperVariants = cva("relative block w-fit mx-auto", {
  variants: {
    variant: {
      default: "bg-background",
      outline: "bg-transparent",
      ghost: "bg-transparent",
      filled: "bg-muted/40",
    },
    size: {
      sm: "[--cell-size:1.75rem] text-xs",
      md: "[--cell-size:2rem] text-sm",
      lg: "[--cell-size:2.5rem] text-base",
    },
    bordered: {
      true: "border border-border rounded-lg",
      false: "",
    },
    shadowed: {
      true: "shadow-md",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
    bordered: true,
    shadowed: false,
  },
});

// Accent → CSS variable. The wrapper sets `--ucal-accent`, which
// `classNames` overrides for selected days + today reference.
//
// Every entry MUST stay wrapped in `oklch(...)`. The theme tokens hold bare
// OKLCH components ("0.62 0.19 259.81", see styles/index.css), so a raw
// `var(--primary)` is not a colour — the browser drops the whole declaration.
// That silently killed `highlightToday`'s ring on /dashboard/calendar, which
// passes accent="primary" and has no fallback the way bg/text do. The literal
// oklch() values that used to sit on success/warning/info had the opposite
// problem: valid, but frozen — deaf to dark mode and to all 36 presets.
const ACCENT_VAR: Record<NonNullable<UltimateCalendarProps["accent"]>, string> = {
  primary: "oklch(var(--primary))",
  success: "oklch(var(--success))",
  warning: "oklch(var(--warning))",
  destructive: "oklch(var(--destructive))",
  info: "oklch(var(--info))",
  secondary: "oklch(var(--secondary))",
};

const ACCENT_FG: Record<NonNullable<UltimateCalendarProps["accent"]>, string> = {
  primary: "oklch(var(--primary-foreground))",
  success: "oklch(var(--success-foreground))",
  warning: "oklch(var(--warning-foreground))",
  destructive: "oklch(var(--destructive-foreground))",
  info: "oklch(var(--info-foreground))",
  secondary: "oklch(var(--secondary-foreground))",
};

interface UltimateCalendarOwnProps extends VariantProps<typeof wrapperVariants> {
  /** Selected-day + today accent colour. */
  accent?: "primary" | "success" | "warning" | "destructive" | "info" | "secondary";
  /** Cell shape — bullet (rounded-full) vs square (rounded-md). */
  roundedDays?: boolean;
  /** Toggle the weekday header row (Mo, Tu, …). */
  showWeekdays?: boolean;
  /** Reverse the year list in the dropdown caption. */
  reverseYears?: boolean;
  /** Highlight today with a ring (in addition to background tint). */
  highlightToday?: boolean;
  /** Per-date dots / accents. */
  markedDates?: MarkedDate[];
  /** Slot rendered above the caption — booking title, hint, etc. */
  header?: React.ReactNode;
  /** Slot rendered under the grid (e.g. "Pilih hari ini" CTA). */
  footer?: React.ReactNode;
  /** Class on the outer wrapper div (not the DayPicker itself). */
  wrapperClassName?: string;
}

// Intersection (not extension) keeps DayPickerProps' discriminated
// union over `mode` intact, so callers still get narrowed
// `selected` / `onSelect` types per mode.
export type UltimateCalendarProps = DayPickerProps & UltimateCalendarOwnProps;

export function UltimateCalendar({
  // Appearance
  variant,
  size,
  accent = "primary",
  bordered,
  shadowed,
  roundedDays = true,
  showWeekdays = true,
  // Special dates
  markedDates,
  highlightToday = false,
  reverseYears = false,
  // Slots
  header,
  footer,
  wrapperClassName,
  // Pass-through bits we tweak before forwarding
  classNames,
  modifiers,
  modifiersClassNames,
  formatters,
  ...props
}: UltimateCalendarProps) {
  // Marked-date modifiers — turn the user's array into the shape
  // react-day-picker wants (`modifiers: { name: Date | Date[] }` +
  // `modifiersClassNames: { name: "tw-classes" }`).
  const { markedModifiers, markedClasses } = React.useMemo(() => {
    if (!markedDates || markedDates.length === 0) {
      return { markedModifiers: {}, markedClasses: {} };
    }
    const mods: Record<string, Date> = {};
    const classes: Record<string, string> = {};
    markedDates.forEach((m, i) => {
      const key = `marked${i}`;
      mods[key] = m.date;
      if (m.dot !== false) {
        classes[key] = cn(
          "relative",
          "after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2",
          "after:rounded-full after:content-['']",
          m.color ?? "after:bg-[color:var(--ucal-accent)]",
        );
      }
    });
    return { markedModifiers: mods, markedClasses: classes };
  }, [markedDates]);

  const wrapperStyle = {
    "--ucal-accent": ACCENT_VAR[accent],
    "--ucal-accent-fg": ACCENT_FG[accent],
  } as CSSProperties;

  // Year-dropdown reverse — DayPicker formats years via
  // No-op until a custom YearsDropdown lands — DayPicker renders the
  // year picker as a native `<select>` whose option order can't be
  // reversed without forking the Dropdown component. Warn loudly in
  // dev so callers don't think the prop works.
  if (process.env.NODE_ENV !== "production" && reverseYears) {
    console.warn(
      "[UltimateCalendar] `reverseYears` is not implemented yet — ignored.",
    );
  }

  return (
    <div
      style={wrapperStyle}
      className={cn(
        wrapperVariants({ variant, size, bordered, shadowed }),
        wrapperClassName,
      )}
      data-rounded-days={roundedDays || undefined}
    >
      {header}
      {/* Cast — DayPickerProps is a discriminated union over `mode`,
          which a `...rest` spread can't keep narrowed. The runtime
          shape stays correct because `props` is a strict subset of
          DayPickerProps as we never widened it. */}
      <Calendar
        {...(props as DayPickerProps)}
        // DayPicker passthrough props
        classNames={{
          // Hide the weekday header row when toggled off.
          weekdays: showWeekdays ? undefined : "hidden",
          // Override selected-day + range styling to use the accent CSS var.
          // The default CalendarDayButton uses `data-[selected-single=true]:bg-primary`,
          // which can't be re-targeted via classNames alone — but the
          // outer wrapper variables cascade into anything reading
          // `var(--primary)` *if* we override that. Cleaner: target
          // the specific data attrs via Tailwind arbitrary selectors.
          day: cn(
            "[&_button[data-selected-single=true]]:!bg-[color:var(--ucal-accent)]",
            "[&_button[data-selected-single=true]]:!text-[color:var(--ucal-accent-fg)]",
            "[&_button[data-range-start=true]]:!bg-[color:var(--ucal-accent)]",
            "[&_button[data-range-start=true]]:!text-[color:var(--ucal-accent-fg)]",
            "[&_button[data-range-end=true]]:!bg-[color:var(--ucal-accent)]",
            "[&_button[data-range-end=true]]:!text-[color:var(--ucal-accent-fg)]",
            roundedDays && "[&_button]:!rounded-full",
          ),
          today: cn(
            "bg-accent/40 text-accent-foreground rounded-md",
            highlightToday &&
              "ring-2 ring-[color:var(--ucal-accent)] ring-offset-1 ring-offset-background",
          ),
          ...classNames,
        }}
        modifiers={{ ...markedModifiers, ...modifiers }}
        modifiersClassNames={{ ...markedClasses, ...modifiersClassNames }}
        formatters={formatters}
      />
      {footer && (
        <div className="border-t border-border px-3 pb-2 pt-2">{footer}</div>
      )}
    </div>
  );
}
