"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { formatDateFull } from "@/shared/lib/formatDate";
import { getAgendaStyle } from "@/shared/lib/agendaStyles";
import type { AgendaItem } from "@/shared/hooks/useAgenda";
import { localDateKey, startOfMonth } from "../lib/dateKeys";

/** 2024-01-01 was a Monday, so this walks Sen → Min. */
const WEEKDAY_LABELS = Array.from({ length: 7 }, (_, i) =>
  new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(
    new Date(2024, 0, 1 + i),
  ),
);

const MONTH_TITLE = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
});

/** Events shown inline before the cell collapses into "+N lainnya". */
const MAX_CHIPS = 3;

interface DayCellData {
  date: Date;
  key: string;
  outside: boolean;
}

export interface MonthGridProps {
  /** Any date inside the month to render. */
  month: Date;
  todayKey: string;
  selectedKey: string;
  /** Already filtered by the type chips, already sorted by time. */
  eventsByDate: Map<string, AgendaItem[]>;
  onMonthChange: (next: Date) => void;
  onSelectDate: (key: string) => void;
  onOpenEvent: (item: AgendaItem) => void;
  onAddAt: (key: string) => void;
}

/**
 * Desktop month view — the whole month's commitments at a glance.
 *
 * Deliberately NOT react-day-picker: that renders a date *picker* (one
 * button per day, sized to the number), and we need cells tall enough to
 * carry the events themselves. The compact picker still runs the mobile
 * layout, where a per-day agenda list is the right shape.
 *
 * Reads only the events the slice already loaded — no extra query.
 */
export function MonthGrid({
  month,
  todayKey,
  selectedKey,
  eventsByDate,
  onMonthChange,
  onSelectDate,
  onOpenEvent,
  onAddAt,
}: MonthGridProps) {
  const cells = useMemo<DayCellData[]>(() => {
    const first = startOfMonth(month);
    // Monday-first, matching the id-ID week and the picker's locale.
    const lead = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(
      first.getFullYear(),
      first.getMonth() + 1,
      0,
    ).getDate();
    // 5 or 6 rows, whichever the month actually needs — no dead row.
    const total = Math.ceil((lead + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const date = new Date(
        first.getFullYear(),
        first.getMonth(),
        1 - lead + i,
      );
      return {
        date,
        key: localDateKey(date),
        outside: date.getMonth() !== first.getMonth(),
      };
    });
  }, [month]);

  const shiftMonth = (delta: number) =>
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {MONTH_TITLE.format(month)}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => shiftMonth(-1)}
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => todayKey && onSelectDate(todayKey)}
            disabled={!todayKey}
          >
            Hari ini
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => shiftMonth(1)}
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div
          aria-hidden
          className="grid grid-cols-7 border-b border-border bg-muted/40"
        >
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>
        {/* gap-px over a border-coloured backdrop = hairline rules that
            follow the theme in both light and dark. */}
        <div className="grid grid-cols-7 gap-px bg-border">
          {cells.map((cell) => (
            <DayCell
              key={cell.key}
              cell={cell}
              items={eventsByDate.get(cell.key) ?? []}
              isToday={cell.key === todayKey}
              isSelected={cell.key === selectedKey}
              onSelectDate={onSelectDate}
              onOpenEvent={onOpenEvent}
              onAddAt={onAddAt}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface DayCellProps {
  cell: DayCellData;
  items: AgendaItem[];
  isToday: boolean;
  isSelected: boolean;
  onSelectDate: (key: string) => void;
  onOpenEvent: (item: AgendaItem) => void;
  onAddAt: (key: string) => void;
}

function DayCell({
  cell,
  items,
  isToday,
  isSelected,
  onSelectDate,
  onOpenEvent,
  onAddAt,
}: DayCellProps) {
  const shown = items.slice(0, MAX_CHIPS);
  const rest = items.length - shown.length;
  const fullDate = formatDateFull(cell.date);

  return (
    <div
      className={cn(
        // min-w-0: a grid item's automatic minimum is its min-content width,
        // so without this a long event title would widen its whole column.
        "group/cell relative flex min-h-[6.75rem] min-w-0 flex-col gap-1 p-1.5",
        cell.outside ? "bg-muted/40" : "bg-card",
        isSelected && "ring-2 ring-inset ring-brand",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => onSelectDate(cell.key)}
          aria-current={isToday ? "date" : undefined}
          aria-label={
            items.length
              ? `${fullDate}, ${items.length} agenda`
              : `${fullDate}, tidak ada agenda`
          }
          className={cn(
            // h-7/1.75rem, not h-6. `--font-scale` defaults to 0.92 and scales the
            // rem base, so a nominal 24px h-6 renders at 22px and lands under
            // the WCAG 2.5.8 target size. 1.75rem x 14.72px = 25.8px.
            "inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-1 text-xs font-medium tabular-nums transition-colors",
            isToday
              ? "bg-brand text-brand-foreground"
              : "hover:bg-muted focus-visible:bg-muted",
            !isToday && cell.outside && "text-muted-foreground",
          )}
        >
          {cell.date.getDate()}
        </button>
        <button
          type="button"
          onClick={() => onAddAt(cell.key)}
          aria-label={`Tambah agenda pada ${fullDate}`}
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover/cell:opacity-100"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {items.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {shown.map((item) => {
            const style = getAgendaStyle(item.type);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onOpenEvent(item)}
                  title={`${item.time} · ${item.title}`}
                  aria-label={`Edit ${item.title}, ${item.time}`}
                  className={cn(
                    "flex w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-left text-xs transition-opacity hover:opacity-80",
                    style.cls,
                  )}
                >
                  <span className="shrink-0 tabular-nums opacity-80">
                    {item.time}
                  </span>
                  <span className="min-w-0 truncate">{item.title}</span>
                </button>
              </li>
            );
          })}
          {rest > 0 ? (
            <li>
              <button
                type="button"
                onClick={() => onSelectDate(cell.key)}
                className="w-full rounded-md px-1.5 text-left text-xs text-muted-foreground hover:text-foreground"
              >
                +{rest} lainnya
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
