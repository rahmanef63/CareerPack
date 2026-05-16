"use client";

import * as React from "react";

import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

/**
 * Responsive DataTable.
 *
 * Desktop (≥lg): shadcn Table — rows + columns.
 * Mobile (<lg): stacked Card list — each row becomes a card, column
 * headers render as inline labels next to their values.
 *
 * Zero built-in sorting/filtering/pagination — the primitive is a
 * renderer, not a data layer. Wrap with TanStack or slice-local logic.
 */

export interface ResponsiveDataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  /** Extra <td> / mobile value classes. */
  className?: string;
  /** Extra <th> classes. */
  headerClassName?: string;
  /** Hide column from mobile card layout. Default false. */
  hideOnMobile?: boolean;
  /** Skip rendering the label in mobile card (for action/avatar columns). */
  hideMobileLabel?: boolean;
}

export interface ResponsiveDataTableProps<T> {
  data: ReadonlyArray<T>;
  columns: ReadonlyArray<ResponsiveDataTableColumn<T>>;
  getRowKey: (row: T, index: number) => string | number;
  /** Optional row click handler — on mobile makes entire card clickable. */
  onRowClick?: (row: T, index: number) => void;
  /** Override the default mobile card rendering entirely. */
  mobileCard?: (row: T, index: number) => React.ReactNode;
  /** Rendered in place of body when data is empty. */
  empty?: React.ReactNode;
  caption?: React.ReactNode;
  className?: string;
  /** Extra class for mobile card container. */
  mobileCardClassName?: string;
}

export function ResponsiveDataTable<T>({
  data,
  columns,
  getRowKey,
  onRowClick,
  mobileCard,
  empty,
  caption,
  className,
  mobileCardClassName,
}: ResponsiveDataTableProps<T>) {
  const isMobile = useIsMobile();

  if (data.length === 0 && empty) {
    return <div className={className}>{empty}</div>;
  }

  if (isMobile) {
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((row, i) => {
          const key = getRowKey(row, i);
          if (mobileCard) {
            return (
              <React.Fragment key={key}>{mobileCard(row, i)}</React.Fragment>
            );
          }
          const visibleCols = columns.filter((c) => !c.hideOnMobile);
          const clickable = Boolean(onRowClick);
          return (
            <div
              key={key}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? () => onRowClick?.(row, i) : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick?.(row, i);
                      }
                    }
                  : undefined
              }
              className={cn(
                "rounded-lg border border-border bg-card p-3 shadow-sm",
                clickable &&
                  "cursor-pointer transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                mobileCardClassName,
              )}
            >
              <dl className="space-y-1.5 text-sm">
                {visibleCols.map((col) => (
                  <div
                    key={col.id}
                    className="flex items-start justify-between gap-3"
                  >
                    {!col.hideMobileLabel && (
                      <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {col.header}
                      </dt>
                    )}
                    <dd
                      className={cn(
                        "min-w-0 flex-1 text-right text-foreground",
                        col.hideMobileLabel && "text-left",
                        col.className,
                      )}
                    >
                      {col.cell(row, i)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Table className={className}>
      {caption && <TableCaption>{caption}</TableCaption>}
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.id} className={col.headerClassName}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, i) => {
          const key = getRowKey(row, i);
          const clickable = Boolean(onRowClick);
          return (
            <TableRow
              key={key}
              data-clickable={clickable || undefined}
              onClick={clickable ? () => onRowClick?.(row, i) : undefined}
              className={cn(clickable && "cursor-pointer")}
            >
              {columns.map((col) => (
                <TableCell key={col.id} className={col.className}>
                  {col.cell(row, i)}
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
