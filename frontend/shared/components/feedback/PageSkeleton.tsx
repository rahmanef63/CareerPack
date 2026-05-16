import { Skeleton } from "@/shared/components/ui/skeleton";

/**
 * Fallback placeholder untuk dynamic-imported slice page.
 * Shape-aware: header title + description + tab row + card grid —
 * cukup dekat dengan layout mayoritas slice (cv-generator,
 * skill-roadmap, document-checklist, calculator, mock-interview,
 * matcher, portfolio, notifications) sehingga konten final
 * menggantikan tanpa layout shift besar.
 *
 * Dipakai oleh `DASHBOARD_VIEWS` loading fallback.
 */
export function PageSkeleton() {
  return (
    <div
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Memuat halaman</span>

      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="flex gap-2" aria-hidden="true">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border border-border p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
