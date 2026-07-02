import { Quote } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface Testimonial {
  initial: string;
  hue: string;
  persona: string;
  quote: string;
  rotate: string;
}

// Illustrative usage scenarios — not real user quotes. CareerPack is early-stage
// and has no verified testimonials yet, so these are deliberately unnamed personas
// (no fabricated names/cities) describing how a feature is meant to be used.
const TESTIMONIALS: Testimonial[] = [
  {
    initial: "F",
    hue: "from-violet-400 to-violet-600",
    persona: "Skenario: Fresh Graduate",
    quote:
      "Pakai template CV builder untuk menyusun CV yang terstruktur rapi agar lebih mudah terbaca sistem screening ATS.",
    rotate: "-rotate-1",
  },
  {
    initial: "C",
    hue: "from-sky-400 to-sky-600",
    persona: "Skenario: Career Switcher",
    quote:
      "Latihan wawancara dengan asisten AI untuk membangun kepercayaan diri sebelum pindah jalur karir ke bidang baru.",
    rotate: "rotate-1",
  },
  {
    initial: "P",
    hue: "from-amber-400 to-amber-600",
    persona: "Skenario: Pencari Kerja Aktif",
    quote:
      "Pakai tracker lamaran untuk memantau banyak lamaran sekaligus dan tahu mana yang perlu di-follow up.",
    rotate: "-rotate-1",
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative border-t border-border bg-muted/20 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <span className="inline-flex items-center gap-2 text-brand">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-brand text-[10px]">05</span>
              Skenario Penggunaan
            </span>
            <span className="h-px w-8 bg-border" />
            <span>Contoh Ilustratif</span>
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Contoh Skenario Penggunaan
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Ilustrasi cara CareerPack dipakai untuk beberapa situasi umum — bukan testimoni atau kutipan pengguna sungguhan.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => (
            <div
              key={testimonial.persona}
              className={cn(
                "relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-transform duration-300 hover:rotate-0",
                testimonial.rotate
              )}
            >
              <span className="absolute right-5 top-5 font-mono text-[10px] text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Quote className="mb-4 h-6 w-6 text-brand/40" aria-hidden />
              <p className="text-sm leading-relaxed text-foreground">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-dotted border-border pt-4">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-primary-foreground",
                    testimonial.hue
                  )}
                >
                  {testimonial.initial}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{testimonial.persona}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
