"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { cn } from "@/shared/lib/utils";
import { KIND_OPTIONS, bytesToHuman, type KindFilter } from "./types";

interface Props {
  stats: { total: number; totalBytes: number; used: number };
  search: string;
  onSearchChange: (v: string) => void;
  kind: KindFilter;
  onKindChange: (v: KindFilter) => void;
  allTags: string[];
  activeTag: string | null;
  onActiveTagChange: (v: string | null) => void;
}

export function LibraryToolbar({
  stats, search, onSearchChange, kind, onKindChange,
  allTags, activeTag, onActiveTagChange,
}: Props) {
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <StatBox label="Total file" value={stats.total} />
        <StatBox label="Dipakai" value={stats.used} />
        <StatBox label="Ukuran" value={bytesToHuman(stats.totalBytes)} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, catatan, tag…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pl-9"
          />
          {search && (
            <button
              type="button"
              aria-label="Bersihkan"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <ResponsiveSelect value={kind} onValueChange={(v) => onKindChange(v as KindFilter)}>
          <ResponsiveSelectTrigger className="h-9 w-[140px]" />
          <ResponsiveSelectContent>
            {KIND_OPTIONS.map((o) => (
              <ResponsiveSelectItem key={o.value} value={o.value}>
                {o.label}
              </ResponsiveSelectItem>
            ))}
          </ResponsiveSelectContent>
        </ResponsiveSelect>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((t) => {
            const active = activeTag === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onActiveTagChange(active ? null : t)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                #{t}
              </button>
            );
          })}
          {activeTag && (
            <button
              type="button"
              onClick={() => onActiveTagChange(null)}
              className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Bersihkan
            </button>
          )}
        </div>
      )}
    </>
  );
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
