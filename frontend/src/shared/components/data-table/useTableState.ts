import { useMemo, useState } from "react";
import type { ColumnDef, FilterDef, SortState } from "./types";
import { sortRows } from "./comparators";

interface UseTableStateInput<T> {
  data: ReadonlyArray<T>;
  columns: ReadonlyArray<ColumnDef<T>>;
  filters: ReadonlyArray<FilterDef<T>>;
  /** Returns concatenated text used for case-insensitive search. */
  searchAccessor: (row: T) => string;
}

interface UseTableStateOutput<T> {
  search: string;
  setSearch: (s: string) => void;
  filterValues: Record<string, string>;
  setFilter: (id: string, value: string) => void;
  clearFilters: () => void;
  sort: SortState | null;
  setSort: (s: SortState | null) => void;
  /** Final pipeline output: data → filter → search → sort. */
  visibleRows: T[];
  /** True when search/filter is narrowing the dataset. */
  isFiltered: boolean;
}

/**
 * Owns sort/search/filter state for a `<DataTable>`. Pure-derive on
 * the data prop — no internal copy. Pipeline order is filter →
 * search → sort so sort runs on the smallest possible array.
 */
export function useTableState<T>({
  data,
  columns,
  filters,
  searchAccessor,
}: UseTableStateInput<T>): UseTableStateOutput<T> {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortState | null>(null);

  const setFilter = (id: string, value: string) => {
    setFilterValues((prev) => {
      if (!value) {
        const { [id]: _omit, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: value };
    });
  };

  const clearFilters = () => setFilterValues({});

  const visibleRows = useMemo(() => {
    let rows: T[] = [...data];

    // Filter dropdowns first — usually the most aggressive narrower.
    for (const f of filters) {
      const v = filterValues[f.id];
      if (!v) continue;
      rows = rows.filter((r) => f.accessor(r) === v);
    }

    // Search (case-insensitive substring match against searchAccessor).
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => searchAccessor(r).toLowerCase().includes(q));
    }

    // Sort last — accessor lookups are usually heavier than substring
    // checks, no point sorting then re-filtering.
    if (sort) {
      const col = columns.find((c) => c.id === sort.columnId);
      if (col) rows = sortRows(rows, col, sort.direction);
    }
    return rows;
  }, [data, filters, filterValues, search, searchAccessor, sort, columns]);

  return {
    search,
    setSearch,
    filterValues,
    setFilter,
    clearFilters,
    sort,
    setSort,
    visibleRows,
    isFiltered: search.trim().length > 0 || Object.keys(filterValues).length > 0,
  };
}
