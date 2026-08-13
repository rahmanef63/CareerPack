"use client";

import { useMemo, useState } from "react";

import type {
  JobBrowserView,
  JobListing,
  JobSortKey,
  SeniorityFilter,
  WorkModeFilter,
} from "../types";

/**
 * Filter/sort state for the job list, hoisted out of the old
 * `JobBrowser` so the controls can render in the desktop rail while the
 * results render in the main column (see `MatcherView`). One state
 * object serves both the "Lowongan Saya" and "Semua Lowongan" sub-tabs
 * — the sub-tab only picks which source array gets fed in, so a filter
 * the user set stays applied when they switch.
 *
 * Filtering + sorting stay client-side and byte-for-byte what
 * `JobBrowser` did; nothing here touches scoring or a Convex query.
 */
export interface JobFilterState {
  search: string;
  setSearch: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  workMode: WorkModeFilter;
  setWorkMode: (value: WorkModeFilter) => void;
  seniority: SeniorityFilter;
  setSeniority: (value: SeniorityFilter) => void;
  sort: JobSortKey;
  setSort: (value: JobSortKey) => void;
  view: JobBrowserView;
  setView: (value: JobBrowserView) => void;
  activeSkills: ReadonlySet<string>;
  toggleSkill: (skill: string) => void;
  clearSkills: () => void;
  /** Most-demanded skills across the source list, capped at 12. */
  topSkills: string[];
  /** Source rows after every active filter + the current sort. */
  filtered: JobListing[];
  filtersActive: boolean;
  resetAll: () => void;
}

export function useJobFilters(
  jobs: ReadonlyArray<JobListing>,
): JobFilterState {
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

  const clearSkills = () => setActiveSkills(new Set());

  const filtered = useMemo(() => {
    let list = jobs.slice();

    if (category !== "all") {
      list = list.filter((j) => j.category === category);
    }
    if (workMode !== "all") {
      list = list.filter((j) => j.workMode === workMode);
    }
    if (seniority !== "all") {
      list = list.filter((j) => j.seniority?.toLowerCase() === seniority);
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

  return {
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
    view,
    setView,
    activeSkills,
    toggleSkill,
    clearSkills,
    topSkills,
    filtered,
    filtersActive,
    resetAll,
  };
}
