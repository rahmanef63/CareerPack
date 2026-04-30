import type { ReactNode } from "react";
import {
  AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown,
} from "lucide-react";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDate } from "@/shared/lib/formatDate";
import type { SortState } from "./types";

export function SortIndicator({ state }: { state: SortState | null }) {
  if (!state) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />;
  return state.direction === "asc" ? (
    <ArrowUp className="h-3 w-3 text-brand" />
  ) : (
    <ArrowDown className="h-3 w-3 text-brand" />
  );
}

export function LoadingRows({ count }: { count: number }) {
  return (
    <div className="space-y-2 rounded-md border border-border p-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="min-w-0 break-words">{message}</p>
    </div>
  );
}

export function EmptyRow({
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

export function renderDefaultCell(value: unknown): ReactNode {
  if (value === null || value === undefined || value === "")
    return <span className="text-muted-foreground/60">—</span>;
  if (value instanceof Date) return formatDate(value);
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  return String(value);
}
