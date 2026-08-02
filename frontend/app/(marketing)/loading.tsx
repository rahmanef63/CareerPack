/**
 * Marketing route streaming skeleton — appears while the (marketing)
 * segment compiles + auth check resolves on first paint. Matches the
 * hero layout so users see structure, not a blank screen.
 */
export default function MarketingLoading() {
  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-brand-muted via-background to-brand-muted">
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="h-7 w-2/3 rounded-full shimmer" />
            <div className="space-y-3">
              <div className="h-12 w-full rounded shimmer" />
              <div className="h-12 w-5/6 rounded shimmer" />
              <div className="h-12 w-3/4 rounded shimmer" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded shimmer" />
              <div className="h-4 w-4/5 rounded shimmer" />
            </div>
            <div className="flex gap-3 pt-4">
              <div className="h-12 w-40 rounded-xl shimmer" />
              <div className="h-12 w-36 rounded-xl shimmer" />
            </div>
          </div>
          <div className="hidden lg:block aspect-[4/3] rounded-2xl shimmer" />
        </div>
      </div>
    </div>
  );
}
