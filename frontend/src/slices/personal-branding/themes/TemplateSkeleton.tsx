import { Skeleton } from "@/shared/components/ui/skeleton";

export function TemplateSkeleton() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 z-10 flex flex-col gap-6 overflow-hidden bg-gradient-to-b from-muted/40 via-background to-background p-6 sm:p-10"
    >
      {/* header strip */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-24 rounded-full" />
        <div className="hidden gap-3 sm:flex">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-3 w-12 rounded" />
          ))}
        </div>
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>

      {/* hero block */}
      <div className="grid flex-1 gap-6 sm:grid-cols-2 sm:gap-10">
        <div className="flex flex-col gap-3 pt-6">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-5/6" />
          <Skeleton className="h-12 w-3/4" />
          <div className="mt-4 grid gap-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <div className="mt-5 flex gap-3">
            <Skeleton className="h-11 w-36 rounded-full" />
            <Skeleton className="h-11 w-32 rounded-full" />
          </div>
        </div>
        <div className="relative">
          <Skeleton className="h-full min-h-[280px] w-full rounded-[180px_180px_24px_24px] sm:rounded-[260px_260px_24px_24px]" />
          <div className="absolute right-2 top-12 hidden w-44 flex-col gap-2 rounded-2xl border border-border bg-card/70 p-4 shadow-md backdrop-blur sm:flex">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-5/6" />
            <Skeleton className="h-2 w-2/3" />
          </div>
          <div className="absolute bottom-6 left-2 hidden w-44 flex-col gap-2 rounded-2xl border border-border bg-card/70 p-4 shadow-md backdrop-blur sm:flex">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-3/4" />
          </div>
        </div>
      </div>

      {/* card row */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 rounded-xl border border-border bg-card/50 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-5/6" />
          </div>
        ))}
      </div>

      <p className="pt-2 text-center text-xs text-muted-foreground">
        Memuat template…
      </p>
    </div>
  );
}
