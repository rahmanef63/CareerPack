"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";

import type { JobSortKey, SeniorityFilter, WorkModeFilter } from "../types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../types";
import type { JobFilterState } from "../hooks/useJobFilters";

const SORT_OPTIONS: ReadonlyArray<{ value: JobSortKey; label: string }> = [
  { value: "newest", label: "Terbaru" },
  { value: "salary-desc", label: "Gaji terbesar" },
  { value: "company-asc", label: "Perusahaan A-Z" },
];

const SENIORITY_OPTIONS: ReadonlyArray<{
  value: SeniorityFilter;
  label: string;
}> = [
  { value: "all", label: "Semua level" },
  { value: "junior", label: "Junior" },
  { value: "mid-level", label: "Mid-level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
];

const WORK_MODE_OPTIONS: ReadonlyArray<{
  value: WorkModeFilter;
  label: string;
}> = [
  { value: "all", label: "Semua mode" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS);

/**
 * Every filter control for the job list, as one self-contained card.
 *
 * Lives in the desktop rail (see `MatcherView`) so filters and results
 * are on screen together, instead of the filter row pushing the list a
 * screen down. Below `lg` the same card stacks above the list and
 * collapses to just its search field — a rail's worth of controls
 * inlined on a phone would bury the results.
 *
 * Options render as chip groups rather than `<select>`s on purpose:
 * every group here is 3-7 short options, the whole set stays legible at
 * a glance in a 20rem rail, and each chip is its own labelled toggle
 * instead of a combobox that has to be opened to be read.
 */
export function JobFilterPanel({ filters }: { filters: JobFilterState }) {
  const {
    search,
    setSearch,
    category,
    setCategory,
    workMode,
    setWorkMode,
    seniority,
    setSeniority,
    sort,
    setSort,
    activeSkills,
    toggleSkill,
    clearSkills,
    topSkills,
    filtersActive,
    resetAll,
  } = filters;

  const [expanded, setExpanded] = useState(false);

  const activeCount =
    (category !== "all" ? 1 : 0) +
    (workMode !== "all" ? 1 : 0) +
    (seniority !== "all" ? 1 : 0) +
    activeSkills.size;

  return (
    <section
      aria-label="Filter lowongan"
      className="space-y-4 rounded-xl border border-border bg-card p-4"
    >
      <header className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-brand" />
          Filter
          {activeCount > 0 && (
            <span className="rounded-full bg-brand px-1.5 text-xs font-semibold tabular-nums text-brand-foreground">
              {activeCount}
            </span>
          )}
        </h2>
        {filtersActive && (
          <button
            type="button"
            onClick={resetAll}
            className="text-xs font-medium text-brand hover:underline"
          >
            Reset semua
          </button>
        )}
      </header>

      {/* Search — always visible, on every viewport */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          // Not type="search" — Chrome then paints its own clear button
          // on top of the one below.
          type="text"
          aria-label="Cari lowongan"
          placeholder="Cari judul, perusahaan, skill…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-9 pr-9"
        />
        {search && (
          <button
            type="button"
            aria-label="Bersihkan pencarian"
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Disclosure — phones only; the rail always shows the full set. */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:hidden"
      >
        <span>{expanded ? "Sembunyikan filter" : "Filter lanjutan"}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      <div className={cn("space-y-4", !expanded && "hidden lg:block")}>
        <ChipGroup label="Bidang">
          <Chip
            active={category === "all"}
            onClick={() => setCategory("all")}
            label="Semua"
          />
          {CATEGORY_KEYS.map((key) => (
            <Chip
              key={key}
              active={category === key}
              onClick={() => setCategory(key)}
              label={CATEGORY_LABELS[key]}
              idleClass={CATEGORY_COLORS[key]}
            />
          ))}
        </ChipGroup>

        <ChipGroup label="Mode kerja">
          {WORK_MODE_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              active={workMode === o.value}
              onClick={() => setWorkMode(o.value)}
              label={o.label}
            />
          ))}
        </ChipGroup>

        <ChipGroup label="Level">
          {SENIORITY_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              active={seniority === o.value}
              onClick={() => setSeniority(o.value)}
              label={o.label}
            />
          ))}
        </ChipGroup>

        <ChipGroup label="Urutkan">
          {SORT_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              active={sort === o.value}
              onClick={() => setSort(o.value)}
              label={o.label}
            />
          ))}
        </ChipGroup>

        {topSkills.length > 0 && (
          <ChipGroup
            label="Skill populer"
            action={
              activeSkills.size > 0 ? (
                <button
                  type="button"
                  onClick={clearSkills}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Bersihkan tag
                </button>
              ) : undefined
            }
          >
            {topSkills.map((s) => (
              <Chip
                key={s}
                active={activeSkills.has(s)}
                onClick={() => toggleSkill(s)}
                label={`#${s}`}
              />
            ))}
          </ChipGroup>
        )}
      </div>
    </section>
  );
}

function ChipGroup({
  label,
  action,
  children,
}: {
  label: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span
          id={`jobfilter-${slug(label)}`}
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          {label}
        </span>
        {action}
      </div>
      <div
        role="group"
        aria-labelledby={`jobfilter-${slug(label)}`}
        className="flex flex-wrap gap-1.5"
      >
        {children}
      </div>
    </div>
  );
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
  /** Optional tinted resting style (category hues). */
  idleClass?: string;
}

function Chip({ active, onClick, label, idleClass }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "max-w-full truncate rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-brand text-brand-foreground"
          : idleClass
            ? cn(idleClass, "hover:brightness-110")
            : "bg-muted text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
