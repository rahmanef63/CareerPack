"use client";

import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";

interface Props {
  page: number;
  pageSize: number;
  pageCount: number;
  totalRows: number;
  rangeStart: number;
  rangeEnd: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
  pageSizeOptions: ReadonlyArray<number>;
  isFiltered: boolean;
  dataLength: number;
  selectionCount: number;
}

export function PaginationFooter({
  page, pageSize, pageCount, totalRows, rangeStart, rangeEnd,
  onPageChange, onPageSizeChange, pageSizeOptions,
  isFiltered, dataLength, selectionCount,
}: Props) {
  const canPrev = page > 0;
  const canNext = page < pageCount - 1;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>
          {totalRows === 0
            ? "0 baris"
            : `${rangeStart}–${rangeEnd} dari ${totalRows}`}
          {isFiltered && totalRows !== dataLength && ` (terfilter dari ${dataLength})`}
          {selectionCount > 0 && ` · ${selectionCount} terpilih`}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <label className="mr-1 hidden sm:inline-block">Per halaman:</label>
        <ResponsiveSelect
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <ResponsiveSelectTrigger
            className="h-8 w-[78px]"
            aria-label="Baris per halaman"
          >
            {pageSize}
          </ResponsiveSelectTrigger>
          <ResponsiveSelectContent drawerTitle="Baris per halaman">
            {pageSizeOptions.map((n) => (
              <ResponsiveSelectItem key={n} value={String(n)}>
                {n}
              </ResponsiveSelectItem>
            ))}
          </ResponsiveSelectContent>
        </ResponsiveSelect>
        <span className="mx-2 hidden sm:inline-block">
          Hal {page + 1} / {pageCount}
        </span>
        <span className="mx-1 inline-block sm:hidden">
          {page + 1}/{pageCount}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(0)}
          disabled={!canPrev}
          aria-label="Halaman pertama"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(pageCount - 1)}
          disabled={!canNext}
          aria-label="Halaman terakhir"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
