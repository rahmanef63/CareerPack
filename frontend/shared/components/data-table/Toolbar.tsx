"use client";

import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import type { FilterDef } from "./types";

interface Props<T> {
  search: string;
  setSearch: (s: string) => void;
  searchPlaceholder: string;
  filters: ReadonlyArray<FilterDef<T>>;
  filterValues: Record<string, string>;
  setFilter: (id: string, value: string) => void;
  clearFilters: () => void;
  isFiltered: boolean;
  selectionCount: number;
  bulkActions?: ReactNode;
  toolbarActions?: ReactNode;
}

export function Toolbar<T>({
  search, setSearch, searchPlaceholder,
  filters, filterValues, setFilter, clearFilters, isFiltered,
  selectionCount, bulkActions, toolbarActions,
}: Props<T>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-9 pl-8 pr-8"
        />
        {search && (
          <button
            type="button"
            aria-label="Bersihkan pencarian"
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {filters.map((f) => (
        <ResponsiveSelect
          key={f.id}
          value={filterValues[f.id] ?? ""}
          onValueChange={(v) => setFilter(f.id, v === "__all__" ? "" : v)}
        >
          <ResponsiveSelectTrigger
            className="h-9 min-w-[140px]"
            aria-label={f.label}
          >
            {filterValues[f.id]
              ? (f.options.find((o) => o.value === filterValues[f.id])?.label ??
                  filterValues[f.id])
              : f.label}
          </ResponsiveSelectTrigger>
          <ResponsiveSelectContent>
            <ResponsiveSelectItem value="__all__">
              Semua {f.label.toLowerCase()}
            </ResponsiveSelectItem>
            {f.options.map((o) => (
              <ResponsiveSelectItem key={o.value} value={o.value}>
                {o.label}
              </ResponsiveSelectItem>
            ))}
          </ResponsiveSelectContent>
        </ResponsiveSelect>
      ))}

      {isFiltered && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            clearFilters();
            setSearch("");
          }}
          className="h-9 gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          Reset
        </Button>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {selectionCount > 0 && (
          <>
            <Badge variant="secondary" className="gap-1">
              {selectionCount} terpilih
            </Badge>
            {bulkActions}
          </>
        )}
        {toolbarActions}
      </div>
    </div>
  );
}
