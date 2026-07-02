import { cn } from "@/shared/lib/utils";

interface Step {
  number: string;
  hue: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: "1",
    hue: "from-violet-400 to-violet-600",
    title: "Isi Profil",
    description: "Lengkapi profil karir sekali, dipakai otomatis di semua fitur.",
  },
  {
    number: "2",
    hue: "from-pink-400 to-pink-600",
    title: "Bangun Dokumen",
    description: "CV ATS-friendly, roadmap skill, dan ceklis dokumen tersusun otomatis.",
  },
  {
    number: "3",
    hue: "from-sky-400 to-sky-600",
    title: "Latihan dengan AI",
    description: "Simulasi wawancara dan asisten AI membantu Anda lebih siap.",
  },
  {
    number: "4",
    hue: "from-emerald-400 to-emerald-600",
    title: "Lamar & Lacak",
    description: "Kirim lamaran, lacak progres, sampai tawaran diterima.",
  },
];

function StepMarker({ hue, number }: { hue: string; number: string }) {
  return (
    <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br p-[2px]", hue)}>
      <span className="flex h-full w-full items-center justify-center rounded-full bg-card font-mono text-lg font-semibold text-foreground">
        {number}
      </span>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section className="relative border-t border-border bg-muted/20 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <div className="mb-4 flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <span className="inline-flex items-center gap-2 text-brand">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-brand text-[10px]">03</span>
              Cara Kerja
            </span>
            <span className="h-px w-8 bg-border" />
            <span>4 Langkah</span>
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Dari Profil Kosong Sampai Tawaran Diterima
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Tidak perlu pindah-pindah alat — empat langkah ini sudah mencakup seluruh perjalanan pencarian kerja Anda.
          </p>
        </div>

        {/* Desktop: horizontal connected timeline */}
        <div className="relative hidden lg:grid lg:grid-cols-4 lg:gap-8">
          <div aria-hidden className="absolute left-0 right-0 top-7 border-t border-dashed border-border" />
          {STEPS.map((step) => (
            <div key={step.number} className="relative flex flex-col items-start gap-4">
              <StepMarker hue={step.hue} number={step.number} />
              <div>
                <h3 className="font-medium text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile/tablet: vertical stacked list */}
        <div className="flex flex-col gap-8 lg:hidden">
          {STEPS.map((step, index) => (
            <div key={step.number} className="relative flex gap-4">
              {index < STEPS.length - 1 && (
                <span aria-hidden className="absolute left-7 top-14 h-8 w-px border-l border-dashed border-border" />
              )}
              <StepMarker hue={step.hue} number={step.number} />
              <div className="pt-1">
                <h3 className="font-medium text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
