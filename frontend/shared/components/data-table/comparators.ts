import type { ColumnDef, SortDirection } from "./types";

/**
 * Compare two accessor values. `null` always sorts last regardless
 * of direction (matching SQL NULLS LAST). Strings use locale-aware
 * compare so Indonesian "Ç"/"ñ" don't fall through. Booleans treat
 * `true` > `false`. Dates compare by ms.
 */
export function compareValues(
  a: ReturnType<ColumnDef<unknown>["accessor"]>,
  b: ReturnType<ColumnDef<unknown>["accessor"]>,
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  if (typeof a === "boolean" && typeof b === "boolean") {
    return a === b ? 0 : a ? 1 : -1;
  }
  // Mixed-type fallback: stringify both and locale-compare.
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

/**
 * Stable-sort `rows` by the given column accessor + direction. Stability
 * comes from `[row, originalIndex]` pairs: ties keep insertion order so
 * the UI doesn't shuffle on equal values.
 */
export function sortRows<T>(
  rows: ReadonlyArray<T>,
  column: ColumnDef<T>,
  direction: SortDirection,
): T[] {
  const factor = direction === "asc" ? 1 : -1;
  const indexed = rows.map((row, i) => [row, i, column.accessor(row)] as const);
  indexed.sort((a, b) => {
    const av = a[2];
    const bv = b[2];
    // Nulls always last regardless of direction (SQL NULLS LAST).
    if (av === null && bv === null) return a[1] - b[1];
    if (av === null) return 1;
    if (bv === null) return -1;
    const cmp = compareValues(av, bv);
    if (cmp !== 0) return cmp * factor;
    return a[1] - b[1];
  });
  return indexed.map((x) => x[0]);
}

/**
 * Toggle a sort spec — clicking the active column flips direction;
 * clicking a new column resets to asc.
 */
export function nextSortState(
  current: { columnId: string; direction: SortDirection } | null,
  columnId: string,
): { columnId: string; direction: SortDirection } | null {
  if (!current || current.columnId !== columnId) {
    return { columnId, direction: "asc" };
  }
  if (current.direction === "asc") {
    return { columnId, direction: "desc" };
  }
  // Third click clears sorting.
  return null;
}
