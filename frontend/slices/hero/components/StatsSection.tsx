interface Stat {
  value: string;
  label: string;
}

// CareerPack is early-stage and has no analytics/Convex aggregate wired up
// yet, so this section intentionally does NOT show usage numbers (registered
// users, ATS pass rate, ratings, etc.) — those would be fabricated. It lists
// verifiable product facts instead. Replace with a real Convex-backed
// aggregate once there is an actual data source to report.
const STATS: Stat[] = [
  { value: "4-in-1", label: "CV, Roadmap, Ceklis & Tracker" },
  { value: "ATS-Ready", label: "Struktur CV Ramah Parser ATS" },
  { value: "24/7", label: "Asisten AI Siap Membantu" },
  { value: "Gratis", label: "Mulai Tanpa Kartu Kredit" },
];

export function StatsSection() {
  return (
    <section className="relative border-t border-border bg-brand-muted py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-4 flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <span className="inline-flex items-center gap-2 text-brand">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-brand text-[10px]">04</span>
                Yang Anda Dapatkan
              </span>
              <span className="h-px w-8 bg-border" />
              <span>Fitur Inti</span>
            </div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Dibangun Untuk Pencari Kerja Serius
            </h2>
          </div>
          <p className="max-w-sm text-sm text-brand-muted-foreground">
            CareerPack masih tahap awal — ini fitur inti yang sudah bisa Anda pakai hari ini, bukan angka penggunaan yang belum kami punya.
          </p>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-border border-y border-border sm:grid-cols-4 sm:divide-y-0">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <span className="font-display text-4xl font-semibold tracking-tight text-brand sm:text-5xl">
                {stat.value}
              </span>
              <span className="font-mono text-xs uppercase tracking-widest text-brand-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
