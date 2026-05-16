"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  Briefcase,
  LayoutGrid,
  List,
  Search,
  Users,
  X,
} from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

import type {
  JobBrowserView,
  JobListing,
  JobSortKey,
  SeniorityFilter,
  WorkModeFilter,
} from "../types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../types";
import { JobCard } from "./JobCard";

interface JobBrowserProps {
  jobs: ReadonlyArray<JobListing>;
  loading: boolean;
  onSelect: (job: JobListing) => void;
  /** Empty-state hint shown when `jobs` is non-empty but filters
   *  exclude everything (vs zero source data). */
  emptyHint?: string;
  /** Empty-state when there's no source data at all (different copy). */
  zeroDataHint?: string;
}

const SORT_OPTIONS: ReadonlyArray<{ value: JobSortKey; label: string }> = [
  { value: "newest", label: "Terbaru" },
  { value: "salary-desc", label: "Gaji terbesar" },
  { value: "company-asc", label: "Perusahaan A-Z" },
];

const SENIORITY_OPTIONS: ReadonlyArray<{ value: SeniorityFilter; label: string }> = [
  { value: "all", label: "Semua level" },
  { value: "junior", label: "Junior" },
  { value: "mid-level", label: "Mid-level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
];

const WORK_MODE_OPTIONS: ReadonlyArray<{ value: WorkModeFilter; label: string }> = [
  { value: "all", label: "Semua mode" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS);

/**
 * Browse + filter surface for jobListings — directly mirrors
 * skill-roadmap's RoadmapBrowser pattern (category pills → toolbar →
 * skill chips → grid). All filtering happens client-side; the parent
 * passes a fixed-size result set via `jobs`.
 */
export function JobBrowser({
  jobs,
  loading,
  onSelect,
  emptyHint = "Tidak ada lowongan yang cocok dengan filter saat ini.",
  zeroDataHint = "Belum ada lowongan.",
}: JobBrowserProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [workMode, setWorkMode] = useState<WorkModeFilter>("all");
  const [seniority, setSeniority] = useState<SeniorityFilter>("all");
  const [sort, setSort] = useState<JobSortKey>("newest");
  const [view, setView] = useState<JobBrowserView>("list");
  const [activeSkills, setActiveSkills] = useState<Set<string>>(new Set());

  const topSkills = useMemo(() => {
    const counts = new Map<string, number>();
    for (const j of jobs) {
      for (const s of j.requiredSkills) {
        const key = s.trim();
        if (!key) continue;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([s]) => s);
  }, [jobs]);

  const toggleSkill = (s: string) => {
    setActiveSkills((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = jobs.slice();

    if (category !== "all") {
      list = list.filter((j) => j.category === category);
    }
    if (workMode !== "all") {
      list = list.filter((j) => j.workMode === workMode);
    }
    if (seniority !== "all") {
      list = list.filter(
        (j) => j.seniority?.toLowerCase() === seniority,
      );
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          j.requiredSkills.some((s) => s.toLowerCase().includes(q)),
      );
    }

    if (activeSkills.size > 0) {
      list = list.filter((j) => {
        const hay = new Set(j.requiredSkills.map((s) => s.toLowerCase()));
        for (const s of activeSkills) {
          if (!hay.has(s.toLowerCase())) return false;
        }
        return true;
      });
    }

    list.sort((a, b) => {
      switch (sort) {
        case "newest":
          return b.postedAt - a.postedAt;
        case "salary-desc": {
          // Rows without salary go last; among those with salary,
          // compare by max (or min if max missing).
          const sa = a.salaryMax ?? a.salaryMin ?? -1;
          const sb = b.salaryMax ?? b.salaryMin ?? -1;
          return sb - sa;
        }
        case "company-asc":
          return a.company.localeCompare(b.company);
        default:
          return 0;
      }
    });

    return list;
  }, [jobs, category, workMode, seniority, search, activeSkills, sort]);

  const filtersActive =
    !!search ||
    activeSkills.size > 0 ||
    category !== "all" ||
    workMode !== "all" ||
    seniority !== "all";

  const resetAll = () => {
    setSearch("");
    setActiveSkills(new Set());
    setCategory("all");
    setWorkMode("all");
    setSeniority("all");
  };

  return (
    <div className="space-y-4">
      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <CategoryPill
          active={category === "all"}
          onClick={() => setCategory("all")}
          label="Semua"
        />
        {CATEGORY_KEYS.map((key) => (
          <CategoryPill
            key={key}
            active={category === key}
            onClick={() => setCategory(key)}
            label={CATEGORY_LABELS[key]}
            colorClass={CATEGORY_COLORS[key]}
          />
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari judul, perusahaan, atau skill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
          {search && (
            <button
              type="button"
              aria-label="Bersihkan pencarian"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <ResponsiveSelect
          value={workMode}
          onValueChange={(v) => setWorkMode(v as WorkModeFilter)}
        >
          <ResponsiveSelectTrigger className="h-9 w-auto min-w-[130px]" title="Mode kerja">
            <Briefcase className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
            {WORK_MODE_OPTIONS.find((o) => o.value === workMode)?.label}
          </ResponsiveSelectTrigger>
          <ResponsiveSelectContent>
            {WORK_MODE_OPTIONS.map((o) => (
              <ResponsiveSelectItem key={o.value} value={o.value}>
                {o.label}
              </ResponsiveSelectItem>
            ))}
          </ResponsiveSelectContent>
        </ResponsiveSelect>

        <ResponsiveSelect
          value={seniority}
          onValueChange={(v) => setSeniority(v as SeniorityFilter)}
        >
          <ResponsiveSelectTrigger className="h-9 w-auto min-w-[130px]" title="Filter level">
            <span className="mr-1 text-xs text-muted-foreground">Level:</span>
            {SENIORITY_OPTIONS.find((o) => o.value === seniority)?.label}
          </ResponsiveSelectTrigger>
          <ResponsiveSelectContent>
            {SENIORITY_OPTIONS.map((o) => (
              <ResponsiveSelectItem key={o.value} value={o.value}>
                {o.label}
              </ResponsiveSelectItem>
            ))}
          </ResponsiveSelectContent>
        </ResponsiveSelect>

        <ResponsiveSelect value={sort} onValueChange={(v) => setSort(v as JobSortKey)}>
          <ResponsiveSelectTrigger className="h-9 w-auto min-w-[160px]" title="Urutkan">
            <ArrowUpDown className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
            {SORT_OPTIONS.find((s) => s.value === sort)?.label}
          </ResponsiveSelectTrigger>
          <ResponsiveSelectContent>
            {SORT_OPTIONS.map((s) => (
              <ResponsiveSelectItem key={s.value} value={s.value}>
                {s.label}
              </ResponsiveSelectItem>
            ))}
          </ResponsiveSelectContent>
        </ResponsiveSelect>

        <div className="flex items-center overflow-hidden rounded-md border border-border bg-card">
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
            className="h-9 rounded-none"
            aria-label="Tampilan daftar"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("grid")}
            className="h-9 rounded-none"
            aria-label="Tampilan grid"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Skill chips */}
      {topSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topSkills.map((s) => {
            const active = activeSkills.has(s);
            return (
              <button
                key={s}
                onClick={() => toggleSkill(s)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-brand hover:text-foreground",
                )}
              >
                #{s}
              </button>
            );
          })}
          {activeSkills.size > 0 && (
            <button
              onClick={() => setActiveSkills(new Set())}
              className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Bersihkan tag
            </button>
          )}
        </div>
      )}

      {/* Results meta */}
      {!loading && jobs.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{filtered.length} lowongan ditemukan</span>
          {filtersActive && (
            <button onClick={resetAll} className="text-brand hover:underline">
              Reset semua
            </button>
          )}
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState text={zeroDataHint} />
      ) : filtered.length === 0 ? (
        <EmptyState text={emptyHint} />
      ) : (
        <div
          className={cn(
            "grid gap-3",
            view === "list"
              ? "lg:grid-cols-2"
              : "sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {filtered.map((job) => (
            <JobCard key={job._id} job={job} onView={() => onSelect(job)} />
          ))}
        </div>
      )}
    </div>
  );
}

interface CategoryPillProps {
  active: boolean;
  onClick: () => void;
  label: string;
  colorClass?: string;
}

function CategoryPill({ active, onClick, label, colorClass }: CategoryPillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-brand text-brand-foreground"
          : cn(
              "bg-muted text-muted-foreground hover:text-foreground",
              colorClass && "hover:bg-transparent",
            ),
      )}
    >
      {label}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <Badge variant="outline" className="mb-3">
        Kosong
      </Badge>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
