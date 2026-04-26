/**
 * Public profile streaming skeleton — matches the redesigned portfolio
 * site layout so the visitor sees structure (avatar halo, hero, skill
 * pills, bento grid) instead of a blank loading screen.
 */
export default function PublicProfileLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 h-14">
          <div className="h-6 w-32 rounded shimmer" />
          <div className="h-8 w-20 rounded-md shimmer" />
        </div>
      </header>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-muted/40 via-background to-background">
        <div className="mx-auto max-w-5xl px-4 py-16 flex flex-col items-center gap-6">
          <div className="h-32 w-32 rounded-full shimmer" />
          <div className="h-10 w-3/4 rounded shimmer" />
          <div className="h-5 w-1/2 rounded shimmer" />
          <div className="h-4 w-2/3 rounded shimmer" />
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-12 space-y-3">
        <div className="h-6 w-32 rounded shimmer" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-7 w-20 rounded-full shimmer" />
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          <div className="md:col-span-4 h-56 rounded-xl shimmer" />
          <div className="md:col-span-2 h-44 rounded-xl shimmer" />
          <div className="md:col-span-2 h-44 rounded-xl shimmer" />
          <div className="md:col-span-4 h-56 rounded-xl shimmer" />
        </div>
      </section>
    </div>
  );
}
