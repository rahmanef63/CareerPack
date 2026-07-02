"use client";

import { useScrollReveal } from "@/slices/hero/hooks/useScrollReveal";
import { ToolkitCategoryCard } from "./ToolkitCategoryCard";
import { TrustStripCell } from "./TrustStripCell";
import { useToolkitCategories } from "../hooks/useToolkitCategories";
import { useTrustStrip } from "../hooks/useTrustStrip";

/**
 * Landing "Toolkit" section — replaces the old flat 12-item feature grid
 * with 4 categories (Persiapan / Melamar / Berkembang / Karier Jangka
 * Panjang), sourced from the real dashboard nav registry so labels never
 * drift from the actual app.
 */
export function ToolkitSection() {
  const sectionRef = useScrollReveal<HTMLElement>();
  const { categories, revealDelay } = useToolkitCategories();
  const trustStrip = useTrustStrip();

  return (
    <section
      ref={sectionRef}
      className="relative border-t border-border bg-muted py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="animate-on-scroll opacity-0 mb-12 max-w-2xl">
          <div className="mb-4 flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <span className="inline-flex items-center gap-2 text-primary">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-primary">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Fitur CareerPack
            </span>
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Toolkit Lengkap untuk Setiap Langkah Karier Anda
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Dari menyiapkan dokumen, melamar, mengasah skill, sampai menjaga relasi jangka panjang —
            setiap alat yang Anda butuhkan sudah tersedia begitu Anda masuk.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((category, index) => (
            <ToolkitCategoryCard
              key={category.id}
              category={category}
              style={revealDelay(index)}
            />
          ))}
        </div>

        <div
          className="animate-on-scroll opacity-0 mt-4 rounded-2xl border border-border bg-card p-6"
          style={revealDelay(categories.length)}
        >
          <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-5">
            <div>
              <h3 className="font-display text-xl font-semibold text-foreground">
                Satu Platform, Semua Kebutuhan Karier
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Tidak perlu berpindah aplikasi — semua tahap karier Anda ada di satu tempat.
              </p>
            </div>
            {trustStrip.map((item) => (
              <TrustStripCell key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
