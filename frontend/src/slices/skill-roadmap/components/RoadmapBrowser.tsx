"use client";

import { useMemo, useState } from "react";
import {
  Search, X, LayoutGrid, Table2, ArrowUpDown, Code, Users,
} from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  ResponsiveSelect, ResponsiveSelectContent, ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { cn } from "@/shared/lib/utils";
import { RoadmapTable } from "./RoadmapTable";

// ---- Public shape ------------------------------------------------------

export interface BrowserCategory {
  id: string;            // slug
  name: string;
  icon: string;
  color: string;
  description: string;
  domain: string;
  nodeCount: number;
  totalHours: number;
  isSystem: boolean;
  authorName: string | null;
  tags: string[];
  nodeTags: string[];
  difficultyMix: { beginner: number; intermediate: number; advanced: number };
  popularity: number;
  creationTime: number;
}

export type SortKey =
  | "popularity"
  | "title-asc"
  | "title-desc"
  | "hours-asc"
  | "hours-desc"
  | "topics-desc"
  | "newest";

export type ViewMode = "grid" | "table";

// ---- UI options --------------------------------------------------------

const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: "popularity", label: "Paling populer" },
  { value: "topics-desc", label: "Topik terbanyak" },
  { value: "hours-asc", label: "Jam (terpendek)" },
  { value: "hours-desc", label: "Jam (terpanjang)" },
  { value: "title-asc", label: "Judul A-Z" },
  { value: "title-desc", label: "Judul Z-A" },
  { value: "newest", label: "Terbaru" },
];

const DIFFICULTY_FILTERS: ReadonlyArray<{ value: "all" | "beginner" | "intermediate" | "advanced"; label: string }> = [
  { value: "all", label: "Semua level" },
  { value: "beginner", label: "Pemula" },
  { value: "intermediate", label: "Menengah" },
  { value: "advanced", label: "Lanjutan" },
];

interface RoadmapBrowserProps {
  categories: ReadonlyArray<BrowserCategory>;
  loading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  domainFilter: string;
  onDomainFilterChange: (d: string) => void;
  domainOptions: ReadonlyArray<string>;
  domainLabels: Record<string, string>;
  iconMap: Record<string, React.ElementType>;
}

/**
 * Full browser: domain tabs (existing) + tag chips + difficulty +
 * search + sort + view toggle. Drives RoadmapTable for the table
 * variant; renders its own grid for the card variant.
 */
export function RoadmapBrowser({
  categories,
  loading,
  selectedId,
  onSelect,
  domainFilter,
  onDomainFilterChange,
  domainOptions,
  domainLabels,
  iconMap,
}: RoadmapBrowserProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("popularity");
  const [view, setView] = useState<ViewMode>("grid");
  const [difficulty, setDifficulty] = useState<"all" | "beginner" | "intermediate" | "advanced">("all");
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  // Tag universe — most-frequent first so the chip row prioritises
  // signal. Cap at 12 chips to avoid overflow on small screens.
  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of categories) {
      for (const t of c.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
      for (const t of c.nodeTags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag]) => tag);
  }, [categories]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = categories.slice();

    if (domainFilter !== "all") {
      list = list.filter((c) => c.domain === domainFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)) ||
        c.nodeTags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (activeTags.size > 0) {
      list = list.filter((c) => {
        const all = new Set([...c.tags, ...c.nodeTags]);
        for (const t of activeTags) if (!all.has(t)) return false;
        return true;
      });
    }

    if (difficulty !== "all") {
      list = list.filter((c) => c.difficultyMix[difficulty] > 0);
    }

    list.sort((a, b) => {
      switch (sort) {
        case "popularity":  return b.popularity - a.popularity || a.name.localeCompare(b.name);
        case "title-asc":   return a.name.localeCompare(b.name);
        case "title-desc":  return b.name.localeCompare(a.name);
        case "hours-asc":   return a.totalHours - b.totalHours;
        case "hours-desc":  return b.totalHours - a.totalHours;
        case "topics-desc": return b.nodeCount - a.nodeCount;
        case "newest":      return b.creationTime - a.creationTime;
        default: return 0;
      }
    });

    return list;
  }, [categories, domainFilter, search, activeTags, difficulty, sort]);

  return (
    <div className="space-y-4 mb-8">
      {/* Domain tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(loading ? [] : domainOptions).map((d) => (
          <button
            key={d}
            onClick={() => onDomainFilterChange(d)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              domainFilter === d
                ? "bg-brand text-brand-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {d === "all" ? "Semua" : (domainLabels[d] ?? d)}
          </button>
        ))}
        {loading && (
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
          </div>
        )}
      </div>

      {/* Toolbar: search + difficulty + sort + view */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari roadmap, tag, atau topik..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {search && (
            <button
              type="button"
              aria-label="Bersihkan pencarian"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <ResponsiveSelect value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
          <ResponsiveSelectTrigger className="h-9 w-auto min-w-[130px]" title="Filter level">
            <span className="text-xs text-muted-foreground mr-1">Level:</span>
            {DIFFICULTY_FILTERS.find((d) => d.value === difficulty)?.label}
          </ResponsiveSelectTrigger>
          <ResponsiveSelectContent>
            {DIFFICULTY_FILTERS.map((d) => (
              <ResponsiveSelectItem key={d.value} value={d.value}>{d.label}</ResponsiveSelectItem>
            ))}
          </ResponsiveSelectContent>
        </ResponsiveSelect>

        <ResponsiveSelect value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <ResponsiveSelectTrigger className="h-9 w-auto min-w-[160px]" title="Urutkan">
            <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
            {SORT_OPTIONS.find((s) => s.value === sort)?.label}
          </ResponsiveSelectTrigger>
          <ResponsiveSelectContent>
            {SORT_OPTIONS.map((s) => (
              <ResponsiveSelectItem key={s.value} value={s.value}>{s.label}</ResponsiveSelectItem>
            ))}
          </ResponsiveSelectContent>
        </ResponsiveSelect>

        <div className="flex items-center rounded-md border border-border bg-card overflow-hidden">
          <Button
            variant={view === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("grid")}
            className="h-9 rounded-none"
            aria-label="Tampilan grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={view === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("table")}
            className="h-9 rounded-none"
            aria-label="Tampilan tabel"
          >
            <Table2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tag chips */}
      {topTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topTags.map((tag) => {
            const active = activeTags.has(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                  active
                    ? "bg-brand text-brand-foreground border-brand"
                    : "bg-card text-muted-foreground border-border hover:border-brand hover:text-foreground",
                )}
              >
                #{tag}
              </button>
            );
          })}
          {activeTags.size > 0 && (
            <button
              onClick={() => setActiveTags(new Set())}
              className="px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-border text-muted-foreground hover:text-foreground"
            >
              Bersihkan tag
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Users className="w-3.5 h-3.5" />
          <span>{filtered.length} roadmap{filtered.length === 1 ? "" : ""} ditemukan</span>
          {(search || activeTags.size > 0 || difficulty !== "all" || domainFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setActiveTags(new Set());
                setDifficulty("all");
                onDomainFilterChange("all");
              }}
              className="text-brand hover:underline"
            >
              Reset semua
            </button>
          )}
        </div>
      )}

      {/* Body — grid or table */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {categories.length === 0
            ? "Belum ada template. Admin dapat memuat template default dari panel admin."
            : "Tidak ada roadmap yang cocok dengan filter saat ini."}
        </p>
      ) : view === "table" ? (
        <RoadmapTable
          rows={filtered}
          selectedId={selectedId}
          onSelect={onSelect}
          domainLabels={domainLabels}
          iconMap={iconMap}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((cat) => {
            const Icon = iconMap[cat.icon] ?? Code;
            const isSelected = selectedId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                title={cat.description}
                className={cn(
                  "group flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-left relative",
                  isSelected
                    ? "border-brand bg-brand-muted shadow-md"
                    : "border-border bg-card hover:border-brand hover:bg-muted/50",
                )}
              >
                {/* Popularity ribbon — top-right corner */}
                {cat.popularity > 0 && (
                  <span className="absolute top-1.5 right-1.5 text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-full bg-brand/10 text-brand">
                    {cat.popularity}×
                  </span>
                )}
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
                  cat.color,
                  isSelected && "ring-4 ring-brand",
                )}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={cn(
                  "text-xs font-medium text-center leading-tight",
                  isSelected ? "text-brand" : "text-foreground",
                )}>
                  {cat.name}
                </span>
                {cat.nodeCount > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {cat.nodeCount} topik · {cat.totalHours}j
                  </span>
                )}
                {!cat.isSystem && cat.authorName && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1 leading-none truncate max-w-full">
                    by {cat.authorName}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
