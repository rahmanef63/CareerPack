"use client";

import { Code, Trash2, Trophy, Sparkles } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

export interface SavedRoadmapCard {
  slug: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  domain: string;
  nodeCount: number;
  totalHours: number;
  isSystem: boolean;
  authorName: string | null;
}

interface Props {
  saved: ReadonlyArray<SavedRoadmapCard>;
  loading: boolean;
  activeSlug: string;
  onActivate: (slug: string) => void;
  onRemove: (slug: string) => void;
  onBrowse: () => void;
  iconMap: Record<string, React.ElementType>;
  domainLabels: Record<string, string>;
  /** Optional progress per slug — drives the inline progress chip on each card. */
  progressBySlug?: Record<string, number>;
}

/**
 * Grid of skills the user has bookmarked. Card visual mirrors
 * `RoadmapBrowser` (Cari Skills) so the two tabs feel consistent —
 * but with an active-state ring, a remove button, and a progress
 * chip when available.
 *
 * Empty state nudges the user into the browse tab via `onBrowse`
 * instead of silently showing nothing.
 */
export function SavedRoadmapsGrid({
  saved,
  loading,
  activeSlug,
  onActivate,
  onRemove,
  onBrowse,
  iconMap,
  domainLabels,
  progressBySlug,
}: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (saved.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-muted flex items-center justify-center">
          <Trophy className="w-6 h-6 text-brand" />
        </div>
        <h3 className="font-semibold text-foreground">Belum ada skill tersimpan</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md mx-auto">
          Pilih roadmap dari katalog &quot;Cari Skills&quot; untuk menambahkannya ke sini.
          Setiap skill yang kamu pilih akan tersimpan otomatis.
        </p>
        <Button onClick={onBrowse} variant="default" size="sm">
          <Sparkles className="w-4 h-4 mr-1.5" />
          Buka Cari Skills
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {saved.map((cat) => {
        const Icon = iconMap[cat.icon] ?? Code;
        const isActive = activeSlug === cat.slug;
        const progress = progressBySlug?.[cat.slug];
        return (
          <div
            key={cat.slug}
            className={cn(
              "group relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-left",
              isActive
                ? "border-brand bg-brand-muted shadow-md"
                : "border-border bg-card hover:border-brand hover:bg-muted/50",
            )}
          >
            {/* Remove (X) — top-right, hidden until hover for non-active cards */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(cat.slug);
              }}
              aria-label={`Hapus ${cat.name} dari skill saya`}
              className={cn(
                "absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Active badge — top-left ribbon */}
            {isActive && (
              <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand text-brand-foreground">
                AKTIF
              </span>
            )}

            <button
              type="button"
              onClick={() => onActivate(cat.slug)}
              className="flex flex-col items-center gap-2 w-full text-center"
              title={cat.description}
            >
              <div
                className={cn(
                  "w-10 h-10 mt-2 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
                  cat.color,
                  isActive && "ring-4 ring-brand",
                )}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span
                className={cn(
                  "text-xs font-medium leading-tight",
                  isActive ? "text-brand" : "text-foreground",
                )}
              >
                {cat.name}
              </span>
              <div className="flex flex-col items-center gap-1">
                {cat.nodeCount > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {cat.nodeCount} topik · {cat.totalHours}j
                  </span>
                )}
                {typeof progress === "number" && progress > 0 && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] h-4 px-1.5",
                      progress === 100
                        ? "bg-success/20 text-success"
                        : "bg-brand/15 text-brand",
                    )}
                  >
                    {progress}%
                  </Badge>
                )}
                {!cat.isSystem && cat.authorName && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1 leading-none truncate max-w-full">
                    by {cat.authorName}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[9px] h-4 px-1 leading-none">
                  {domainLabels[cat.domain] ?? cat.domain}
                </Badge>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
