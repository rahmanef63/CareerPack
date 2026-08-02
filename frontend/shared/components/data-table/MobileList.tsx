"use client";

import { Checkbox } from "@/shared/components/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import type { ColumnDef } from "./types";
import { renderDefaultCell } from "./cells";

interface Props<T> {
  rows: ReadonlyArray<T>;
  columns: ReadonlyArray<ColumnDef<T>>;
  rowKey: (row: T) => string;
  selectionEnabled: boolean;
  selectedIds?: Set<string>;
  toggleOne: (id: string) => void;
  onRowClick?: (row: T) => void;
}

export function MobileList<T>({
  rows, columns, rowKey, selectionEnabled, selectedIds,
  toggleOne, onRowClick,
}: Props<T>) {
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
