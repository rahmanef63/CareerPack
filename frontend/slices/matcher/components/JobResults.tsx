"use client";

import { LayoutGrid, List, SearchX, Users } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/feedback/EmptyState";
import { NoResults } from "@/shared/components/illustrations/empty";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

import type { JobBrowserView, JobListing } from "../types";
import { JobCard } from "./JobCard";

interface JobResultsProps {
  /** Rows after filtering + sorting. */
  jobs: ReadonlyArray<JobListing>;
  /** Rows before filtering — separates "no data" from "no matches". */
  sourceCount: number;
  loading: boolean;
  view: JobBrowserView;
  onViewChange: (view: JobBrowserView) => void;
  onSelect: (job: JobListing) => void;
  filtersActive: boolean;
  onResetFilters: () => void;
  /** Empty-state hint when filters exclude everything. */
  emptyHint?: string;
  /** Empty-state when there's no source data at all (different copy). */
  zeroDataHint?: string;
}

/**
 * Result grid for the job list. Filter state lives one level up in
 * `useJobFilters` so the controls can render in the desktop rail.
 *
 * Every grid carries an explicit `grid-cols-1`. A bare `grid` leaves
 * `grid-template-columns: none`, so the single implicit track is `auto`
 * — sized to the widest card's max-content. One long job title then
 * stretched the track to 1168px inside a 390px viewport and the whole
 * page scrolled sideways. `grid-cols-N` compiles to
 * `repeat(N, minmax(0, 1fr))`, which clamps the track to the container.
 *
 * The multi-column breakpoints are `2xl`, not `lg`: the list now sits in
 * the left column of a two-column page, so at `lg` it is only ~420px
 * wide and a second card column would be unreadable.
 */
export function JobResults({
  jobs,
  sourceCount,
  loading,
  view,
  onViewChange,
  onSelect,
  filtersActive,
  onResetFilters,
  emptyHint = "Tidak ada lowongan yang cocok dengan filter saat ini.",
  zeroDataHint = "Belum ada lowongan.",
}: JobResultsProps) {
  return (
    <div className="space-y-3">
      {/* Results meta + density toggle */}
      {!loading && sourceCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5 shrink-0" />
          <span>{jobs.length} lowongan ditemukan</span>
          {filtersActive && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-brand hover:underline"
            >
              Reset semua
            </button>
          )}
          <div className="ml-auto flex items-center overflow-hidden rounded-md border border-border bg-card">
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange("list")}
              className="h-8 rounded-none px-2.5"
              aria-label="Tampilan daftar"
              aria-pressed={view === "list"}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange("grid")}
              className="h-8 rounded-none px-2.5"
              aria-label="Tampilan grid"
              aria-pressed={view === "grid"}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : sourceCount === 0 ? (
        <EmptyState
          illustration={NoResults}
          title="Belum ada lowongan"
          description={zeroDataHint}
          size="lg"
          className="rounded-xl border border-dashed border-border bg-card"
        />
      ) : jobs.length === 0 ? (
        // ponytail: filter miss is transient — icon only, art would read as broken.
        <EmptyState
          icon={SearchX}
          title="Tidak ada hasil"
          description={emptyHint}
          className="rounded-xl border border-dashed border-border bg-card"
        />
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 gap-3",
            view === "list"
              ? "2xl:grid-cols-2"
              : "sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3",
          )}
        >
          {jobs.map((job) => (
            <JobCard key={job._id} job={job} onView={() => onSelect(job)} />
          ))}
        </div>
      )}
    </div>
  );
}
