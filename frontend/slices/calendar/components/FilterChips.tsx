"use client";

import { cn } from "@/shared/lib/utils";
import { TYPE_OPTIONS, type FilterType } from "../constants/agendaTypes";

export interface FilterChipsProps {
  filter: FilterType;
  setFilter: (f: FilterType) => void;
  counts: Map<FilterType, number>;
}

export function FilterChips({ filter, setFilter, counts }: FilterChipsProps) {
  const chips: ReadonlyArray<{ key: FilterType; label: string }> = [
    { key: "all", label: "Semua" },
    ...TYPE_OPTIONS.map((o) => ({ key: o.value as FilterType, label: o.label })),
  ];
  return (
    <div
      role="group"
      aria-label="Filter jenis agenda"
      className="flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {chips.map((c) => {
        const active = c.key === filter;
        const n = counts.get(c.key) ?? 0;
        return (
          <button
            key={c.key}
            type="button"
            aria-pressed={active}
            onClick={() => setFilter(c.key)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border bg-card hover:bg-muted",
            )}
          >
            {c.label}
            {n > 0 ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  active ? "bg-brand-foreground/25" : "bg-muted-foreground/15",
                )}
              >
                {n}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
