import { ArrowRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface FinalCtaSectionProps {
  onGetStarted: () => void;
}

export function FinalCtaSection({ onGetStarted }: FinalCtaSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-from to-brand-to py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-2xl text-center">
          <div className="absolute -top-6 right-0 hidden h-20 w-20 -rotate-12 flex-col items-center justify-center rounded-full border-2 border-dashed border-brand-foreground/40 text-center font-mono text-[9px] font-bold uppercase leading-tight text-brand-foreground sm:flex">
            100%
            <br />
            Gratis
            <br />
            Memulai
          </div>

          <div className="mb-4 flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-widest text-brand-foreground/70">
            <span className="inline-flex items-center gap-2 text-brand-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-brand-foreground/60 text-[10px]">07</span>
              Mulai Sekarang
            </span>
            <span className="h-px w-8 bg-brand-foreground/40" />
            <span>Ajakan Bertindak</span>
          </div>

          <h2 className="font-display text-3xl font-semibold tracking-tight text-brand-foreground sm:text-4xl">
            Siap Mulai Perjalanan Karir Anda?
          </h2>
          <p className="mt-4 text-lg text-brand-foreground/80">
            Satu paket lengkap untuk mempercepat langkah Anda menuju tawaran kerja impian —
            tanpa biaya untuk memulai.
          </p>

          <div className="mt-10 flex justify-center">
            <Button
              size="lg"
              onClick={onGetStarted}
              className="rounded-lg bg-background px-8 py-6 text-lg font-semibold text-foreground shadow-sm hover:bg-background/90"
            >
              Mulai Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
