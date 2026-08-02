import type { ReactNode } from "react";

/**
 * Public types for the shared `<DataTable>` primitive.
 *
 * Generic over the row type `T` so each consumer (CV, Portfolio,
 * Goals, …) keeps its own row shape without `any`. Columns describe
 * how to read + render + sort each cell; filters describe optional
 * dropdown narrowers; bulk actions appear when one or more rows are
 * selected.
 *
 * The component is presentation-only — it owns sort/search/filter
 * state but never mutates the data. Bulk-action handlers are
 * responsible for calling whichever Convex mutation deletes /
 * exports / etc.
 */

export type SortDirection = "asc" | "desc";

export interface SortState {
  columnId: string;
  direction: SortDirection;
}

export interface ColumnDef<T> {
  /** Stable id, used for sort key + React key. */
  id: string;
  header: ReactNode;
  /** Sort key extractor. Return null to push that row to the bottom
   *  regardless of sort direction. */
  accessor: (row: T) => string | number | boolean | Date | null;
  /** Optional custom cell renderer. Falls back to String(accessor). */
  cell?: (row: T) => ReactNode;
  /** Default true. Set false on action columns. */
  sortable?: boolean;
  /** Tailwind width class — `w-32`, `w-1/3`. Optional. */
  width?: string;
  /** `text-left` (default), `text-right` for numerics, `text-center`. */
  align?: "left" | "right" | "center";
  /** Skip on mobile card view. */
  hideOnMobile?: boolean;
  /** When rendered as mobile card, omit the label prefix. */
  hideMobileLabel?: boolean;
}

export interface FilterDef<T> {
  id: string;
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  /** Returns the row's value for this filter dimension. Compared to
   *  the picked option `value`. */
  accessor: (row: T) => string | null | undefined;
}
