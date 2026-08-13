"use client";

import { useState } from "react";
import { Code, Trash2, Sparkles } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { EmptyState } from "@/shared/components/feedback/EmptyState";
import { NoRoadmap } from "@/shared/components/illustrations/empty";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@/shared/components/ui/responsive-alert-dialog";
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
  const [pendingRemove, setPendingRemove] = useState<SavedRoadmapCard | null>(null);

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
      <EmptyState
        illustration={NoRoadmap}
        title="Belum ada skill tersimpan"
        description={`Pilih roadmap dari katalog "Cari Skills" untuk menambahkannya ke sini. Setiap skill yang kamu pilih akan tersimpan otomatis.`}
        action={{ label: "Buka Cari Skills", onClick: onBrowse, icon: Sparkles }}
        size="lg"
        className="rounded-xl border border-dashed border-border"
      />
    );
  }

  return (
    <>
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
                setPendingRemove(cat);
              }}
              aria-label={`Hapus ${cat.name} dari skill saya`}
              className={cn(
                "absolute top-1 right-1 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive-text hover:bg-destructive/10 transition-all",
                isActive
                  ? "opacity-100"
                  : "opacity-100 lg:opacity-0 lg:group-hover:opacity-100",
              )}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Active badge — top-left ribbon */}
            {isActive && (
              <span className="absolute top-1.5 left-1.5 text-xs font-bold leading-none px-1.5 py-1 rounded-full bg-brand text-brand-foreground">
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
                  // `text-brand` on `bg-brand-muted` is the one brand pair
                  // that is not tuned for each other; `-muted-foreground`
                  // is the token designed to sit on `-muted`.
                  isActive ? "text-brand-muted-foreground" : "text-foreground",
                )}
              >
                {cat.name}
              </span>
              <div className="flex flex-col items-center gap-1">
                {cat.nodeCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {cat.nodeCount} topik · {cat.totalHours}j
                  </span>
                )}
                {typeof progress === "number" && progress > 0 && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "h-5 px-1.5",
                      progress === 100
                        ? "bg-success/20 text-success-text"
                        : "bg-brand-muted text-brand-muted-foreground",
                    )}
                  >
                    {progress}%
                  </Badge>
                )}
                {!cat.isSystem && cat.authorName && (
                  <Badge variant="outline" className="h-5 px-1.5 leading-none truncate max-w-full">
                    by {cat.authorName}
                  </Badge>
                )}
                <Badge variant="outline" className="h-5 px-1.5 leading-none">
                  {domainLabels[cat.domain] ?? cat.domain}
                </Badge>
              </div>
            </button>
          </div>
        );
      })}
    </div>

    <ResponsiveAlertDialog
      open={pendingRemove !== null}
      onOpenChange={(o) => !o && setPendingRemove(null)}
    >
      <ResponsiveAlertDialogContent>
        <ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogTitle>Hapus skill ini dari daftar?</ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>
            {pendingRemove
              ? `"${pendingRemove.name}" akan dihapus dari skill tersimpan. Progres yang sudah dicatat untuk skill ini ikut hilang.`
              : ""}
          </ResponsiveAlertDialogDescription>
        </ResponsiveAlertDialogHeader>
        <ResponsiveAlertDialogFooter>
          <ResponsiveAlertDialogCancel>Batal</ResponsiveAlertDialogCancel>
          <ResponsiveAlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              const target = pendingRemove;
              setPendingRemove(null);
              if (target) onRemove(target.slug);
            }}
          >
            Hapus
          </ResponsiveAlertDialogAction>
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogContent>
    </ResponsiveAlertDialog>
    </>
  );
}
