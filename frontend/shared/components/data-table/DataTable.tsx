"use client";

import { useMemo, type ReactNode } from "react";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/shared/components/ui/table";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import type { ColumnDef, FilterDef } from "./types";
import { nextSortState } from "./comparators";
import { useTableState } from "./useTableState";
import { Toolbar } from "./Toolbar";
import { PaginationFooter } from "./PaginationFooter";
import { MobileList } from "./MobileList";
import {
  EmptyRow, ErrorBanner, LoadingRows, SortIndicator, renderDefaultCell,
} from "./cells";

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
  /** Bulk actions appear when ≥1 row selected. */
  bulkActions?: ReactNode;
  isLoading?: boolean;
  /** Surfaces a banner above the table when set. */
  error?: string | null;
  /** Skeleton row count while `isLoading` is true. Defaults to 5. */
  skeletonRows?: number;
  emptyMessage?: ReactNode;
  /** Optional row click → opens detail dialog / navigates / etc. */
  onRowClick?: (row: T) => void;
  className?: string;
  initialPageSize?: number;
  pageSizeOptions?: ReadonlyArray<number>;
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
  error = null,
  skeletonRows = 5,
  emptyMessage = "Belum ada data.",
  onRowClick,
  className,
  initialPageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
}: DataTableProps<T>) {
  const isMobile = useIsMobile();
  const {
    search, setSearch,
    filterValues, setFilter, clearFilters,
    sort, setSort,
    visibleRows, paginatedRows,
    page, setPage, pageSize, setPageSize, pageCount,
    isFiltered,
  } = useTableState({ data, columns, filters, searchAccessor, initialPageSize });

  const selectionEnabled = Boolean(selectedIds && onSelectionChange);
  // Selection works on the *paginated* slice. Selection set is preserved
  // across pages so bulk actions remain global.
  const visibleIds = useMemo(
    () => paginatedRows.map(rowKey),
    [paginatedRows, rowKey],
  );
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
    if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
    else visibleIds.forEach((id) => next.add(id));
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

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <LoadingRows count={skeletonRows} />
      ) : visibleRows.length === 0 ? (
        <EmptyRow isFiltered={isFiltered} fallback={emptyMessage} />
      ) : isMobile ? (
        <MobileList
          rows={paginatedRows}
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
              {paginatedRows.map((row) => {
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

      {!isLoading && visibleRows.length > 0 && (
        <PaginationFooter
          page={page}
          pageSize={pageSize}
          pageCount={pageCount}
          totalRows={visibleRows.length}
          rangeStart={page * pageSize + 1}
          rangeEnd={Math.min((page + 1) * pageSize, visibleRows.length)}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={pageSizeOptions}
          isFiltered={isFiltered}
          dataLength={data.length}
          selectionCount={selectionCount}
        />
      )}
    </div>
  );
}
