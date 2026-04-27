"use client";

import { useMemo, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import { formatDate } from "@/shared/lib/formatDate";
import type { ColumnDef, FilterDef, SortState } from "./types";
import { nextSortState } from "./comparators";
import { useTableState } from "./useTableState";

/**
 * Shared admin-style data table. Features:
 *
 * - Sortable headers — click to cycle asc → desc → off.
 * - Search box — case-insensitive substring against `searchAccessor`.
 * - Filter dropdowns — one per `FilterDef`, exact-match on accessor.
 * - Row selection — checkboxes + select-all-visible toggle.
 * - Bulk actions — appear in toolbar when selection > 0.
 * - Toolbar slot — caller drops Import/Export buttons there.
 * - Mobile fallback — collapsing card list with the same controls.
 *
 * Owns: sort/search/filter state via `useTableState`. Selection is
 * controlled (caller owns the Set) so bulk actions live outside.
 */
export interface DataTableProps<T> {
  data: ReadonlyArray<T>;
  columns: ReadonlyArray<ColumnDef<T>>;
  rowKey: (row: T) => string;
  searchAccessor: (row: T) => string;
  searchPlaceholder?: string;
  filters?: ReadonlyArray<FilterDef<T>>;
  /** Selection — controlled. Provide both or neither. */
  selectedIds?: Set<string>;
  onSelectionChange?: (next: Set<string>) => void;
  /** Toolbar right-side slot — Import / Export / actions. */
  toolbarActions?: ReactNode;
  /** Bulk actions appear when ≥1 row selected. The caller wires the
   *  delete/export-selected logic itself. */
  bulkActions?: ReactNode;
  isLoading?: boolean;
  emptyMessage?: ReactNode;
  /** Optional row click → opens detail dialog / navigates / etc. */
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchAccessor,
  searchPlaceholder = "Cari…",
  filters = [],
  selectedIds,
  onSelectionChange,
  toolbarActions,
  bulkActions,
  isLoading = false,
  emptyMessage = "Belum ada data.",
  onRowClick,
  className,
}: DataTableProps<T>) {
  const isMobile = useIsMobile();
  const {
    search,
    setSearch,
    filterValues,
    setFilter,
    clearFilters,
    sort,
    setSort,
    visibleRows,
    isFiltered,
  } = useTableState({ data, columns, filters, searchAccessor });

  const selectionEnabled = Boolean(selectedIds && onSelectionChange);
  const visibleIds = useMemo(() => visibleRows.map(rowKey), [visibleRows, rowKey]);
  const allVisibleSelected = useMemo(() => {
    if (!selectionEnabled || visibleIds.length === 0) return false;
    return visibleIds.every((id) => selectedIds!.has(id));
  }, [selectionEnabled, visibleIds, selectedIds]);
  const someVisibleSelected = useMemo(() => {
    if (!selectionEnabled) return false;
    return visibleIds.some((id) => selectedIds!.has(id));
  }, [selectionEnabled, visibleIds, selectedIds]);

  const toggleAllVisible = () => {
    if (!selectionEnabled) return;
    const next = new Set(selectedIds);
    if (allVisibleSelected) {
      visibleIds.forEach((id) => next.delete(id));
    } else {
      visibleIds.forEach((id) => next.add(id));
    }
    onSelectionChange!(next);
  };
  const toggleOne = (id: string) => {
    if (!selectionEnabled) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange!(next);
  };

  const handleHeaderClick = (col: ColumnDef<T>) => {
    if (col.sortable === false) return;
    setSort(nextSortState(sort, col.id));
  };

  const selectionCount = selectedIds?.size ?? 0;

  return (
    <div className={cn("space-y-3", className)}>
      <Toolbar
        search={search}
        setSearch={setSearch}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        filterValues={filterValues}
        setFilter={setFilter}
        clearFilters={clearFilters}
        isFiltered={isFiltered}
        selectionCount={selectionCount}
        bulkActions={bulkActions}
        toolbarActions={toolbarActions}
      />

      {isLoading ? (
        <LoadingRows />
      ) : visibleRows.length === 0 ? (
        <EmptyRow isFiltered={isFiltered} fallback={emptyMessage} />
      ) : isMobile ? (
        <MobileList
          rows={visibleRows}
          columns={columns}
          rowKey={rowKey}
          selectionEnabled={selectionEnabled}
          selectedIds={selectedIds}
          toggleOne={toggleOne}
          onRowClick={onRowClick}
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                {selectionEnabled && (
                  <TableHead className="w-10 px-3">
                    <Checkbox
                      aria-label="Pilih semua baris yang terlihat"
                      checked={
                        allVisibleSelected
                          ? true
                          : someVisibleSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={toggleAllVisible}
                    />
                  </TableHead>
                )}
                {columns.map((col) => {
                  const isActive = sort?.columnId === col.id;
                  return (
                    <TableHead
                      key={col.id}
                      className={cn(
                        col.width,
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                        col.sortable !== false && "cursor-pointer select-none hover:bg-muted/60",
                      )}
                      onClick={() => handleHeaderClick(col)}
                      aria-sort={
                        isActive
                          ? sort.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {col.header}
                        {col.sortable !== false && (
                          <SortIndicator state={isActive ? sort : null} />
                        )}
                      </span>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row) => {
                const id = rowKey(row);
                const selected = selectedIds?.has(id);
                return (
                  <TableRow
                    key={id}
                    data-state={selected ? "selected" : undefined}
                    className={cn(
                      onRowClick && "cursor-pointer",
                      selected && "bg-brand-muted/20",
                    )}
                  >
                    {selectionEnabled && (
                      <TableCell className="px-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          aria-label={`Pilih baris ${id}`}
                          checked={selected ?? false}
                          onCheckedChange={() => toggleOne(id)}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell
                        key={col.id}
                        className={cn(
                          col.align === "right" && "text-right tabular-nums",
                          col.align === "center" && "text-center",
                        )}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                      >
                        {col.cell ? col.cell(row) : renderDefaultCell(col.accessor(row))}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {visibleRows.length} dari {data.length} baris
        {isFiltered && " (terfilter)"}
        {selectionCount > 0 && ` · ${selectionCount} terpilih`}
      </p>
    </div>
  );
}

interface ToolbarProps<T> {
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

function Toolbar<T>({
  search,
  setSearch,
  searchPlaceholder,
  filters,
  filterValues,
  setFilter,
  clearFilters,
  isFiltered,
  selectionCount,
  bulkActions,
  toolbarActions,
}: ToolbarProps<T>) {
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

function SortIndicator({ state }: { state: SortState | null }) {
  if (!state) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />;
  return state.direction === "asc" ? (
    <ArrowUp className="h-3 w-3 text-brand" />
  ) : (
    <ArrowDown className="h-3 w-3 text-brand" />
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

function EmptyRow({
  isFiltered,
  fallback,
}: {
  isFiltered: boolean;
  fallback: ReactNode;
}) {
  return (
    <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {isFiltered
        ? "Tidak ada hasil untuk pencarian / filter ini. Reset untuk lihat semua."
        : fallback}
    </div>
  );
}

interface MobileListProps<T> {
  rows: ReadonlyArray<T>;
  columns: ReadonlyArray<ColumnDef<T>>;
  rowKey: (row: T) => string;
  selectionEnabled: boolean;
  selectedIds?: Set<string>;
  toggleOne: (id: string) => void;
  onRowClick?: (row: T) => void;
}

function MobileList<T>({
  rows,
  columns,
  rowKey,
  selectionEnabled,
  selectedIds,
  toggleOne,
  onRowClick,
}: MobileListProps<T>) {
  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const id = rowKey(row);
        const selected = selectedIds?.has(id);
        return (
          <div
            key={id}
            className={cn(
              "rounded-md border border-border bg-card p-3",
              selected && "border-brand/40 bg-brand-muted/10",
              onRowClick && "cursor-pointer",
            )}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            <div className="flex items-start gap-3">
              {selectionEnabled && (
                <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
                  <Checkbox
                    aria-label={`Pilih baris ${id}`}
                    checked={selected ?? false}
                    onCheckedChange={() => toggleOne(id)}
                  />
                </div>
              )}
              <dl className="min-w-0 flex-1 space-y-1.5 text-sm">
                {columns
                  .filter((c) => !c.hideOnMobile)
                  .map((col) => (
                    <div
                      key={col.id}
                      className="grid grid-cols-[max-content_1fr] gap-2"
                    >
                      {!col.hideMobileLabel && (
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {col.header}
                        </dt>
                      )}
                      <dd
                        className={cn(
                          "min-w-0 break-words",
                          col.hideMobileLabel && "col-span-2",
                        )}
                      >
                        {col.cell ? col.cell(row) : renderDefaultCell(col.accessor(row))}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderDefaultCell(value: unknown): ReactNode {
  if (value === null || value === undefined || value === "") return (
    <span className="text-muted-foreground/60">—</span>
  );
  if (value instanceof Date) return formatDate(value);
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  return String(value);
}
