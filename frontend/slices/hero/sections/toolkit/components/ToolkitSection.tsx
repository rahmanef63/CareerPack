"use client";

import type { ComponentType } from "react";
import Link from "next/link";

import {
  AiAssistant,
  DocumentChecklist,
  JobTracker,
  MockInterview,
} from "@/shared/components/illustrations/features";
import { CardSpotlight } from "@/shared/components/ui/aceternity";
import { ResponsiveCarousel } from "@/shared/components/ui/responsive-carousel";
import { useScrollReveal } from "@/slices/hero/hooks/useScrollReveal";

// ponytail: 4 rows of {art, label, line} IS the section. A constants/ +
// config/ + types/ + hooks/ split for 4 rows is exactly what this commit deletes.
// "Bukan janji. Ini produknya." invited exactly the scrutiny this section
// cannot survive: what sits under it is four aria-hidden wireframe SVGs with no
// product text in them, right after a share card showing a populated dashboard.
// "Where are the real screenshots" is the obvious reply, and the old heading was
// what turned stylised art into a contradiction. The art stays — textless is a
// feature here, since it is the only thing on the page that needs no
// translation — so the heading is what has to be honest about it.
const SECTION_HEADING = "Empat alat yang Anda pakai setiap minggu.";

/** Staggered `animationDelay` for the Nth revealed block — matches Hero/Cta. */
const revealDelay = (i: number) => `${(i * 0.1).toFixed(1)}s`;

interface Shot {
  /**
   * Inline SVG component. The four crops this list used to carry existed only
   * to push English UI text out of frame; the illustrations have no text, and
   * all four share one 16:9 viewBox, so there is nothing left to configure.
   */
  Illustration: ComponentType<{ className?: string }>;
  label: string;
  line: string;
}

const SHOTS: Shot[] = [
  {
    Illustration: DocumentChecklist,
    label: "Ceklis Dokumen",
    line: "Kerja lokal dan luar negeri, semua terpantau.",
  },
  {
    Illustration: JobTracker,
    label: "Lacak Lamaran",
    line: "Semua status dalam satu papan.",
  },
  {
    Illustration: AiAssistant,
    label: "Asisten AI",
    line: "Saran resume, skill, dan wawancara dalam satu layar.",
  },
  {
    Illustration: MockInterview,
    label: "Latihan Wawancara",
    line: "Jawab, dapat masukan, ulangi.",
  },
];

export function ToolkitSection() {
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section ref={sectionRef} className="border-t border-border bg-muted py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <h2
            className="animate-on-scroll font-display text-3xl font-semibold tracking-tight text-foreground opacity-0 sm:text-4xl"
            style={{ animationDelay: revealDelay(0) }}
          >
            {SECTION_HEADING}
          </h2>
        </div>

        {/*
          Revealed as ONE unit: a per-cell `.animate-on-scroll` inside a horizontal
          scroller never intersects for off-screen cells, so they'd stay opacity-0.
          The carousel's own title/description props stay unset on purpose — they
          render at dashboard scale (text-base); the landing heading is above.
        */}
        <div
          className="animate-on-scroll mt-12 opacity-0"
          style={{ animationDelay: revealDelay(2) }}
        >
          {/* pt-2 is not spacing — it is focus-ring headroom. The scroller is
              `overflow-x-auto`, which forces overflow-y to auto too, so the
              cell's focus halo would be clipped at the scroller's top edge
              without it. */}
          <ResponsiveCarousel
            cellWidth="w-[82vw] sm:w-[26rem] lg:w-[30rem]"
            cellClassName="pt-2"
          >
            {SHOTS.map((shot) => (
              // Aceternity Card Spotlight: a brand glow tracks the cursor across
              // the cell, and `group-focus-within/spotlight` lights the same glow
              // for keyboard users — which is why the Link lives INSIDE the card
              // rather than wrapping it. The ported component no-ops its handler
              // entirely under prefers-reduced-motion.
              //
              // `[&>*:last-child]:h-full` targets CardSpotlight's internal z-10
              // content wrapper. That div sits between this card and the Link, so
              // without it the Link's own `h-full` resolves against an auto-height
              // parent and equal-height cells collapse to content height.
              <CardSpotlight
                key={shot.label}
                className="h-full rounded-2xl p-0 shadow-sm transition-[transform,box-shadow] [transition-duration:200ms] ease-out hover:-translate-y-1 hover:shadow-lg focus-within:-translate-y-1 focus-within:shadow-lg [&>*:last-child]:h-full"
              >
                <Link
                  href="/login"
                  className="group flex h-full flex-col rounded-2xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  <p className="font-medium text-foreground underline-offset-4 group-hover:underline group-focus-visible:underline">
                    {shot.label}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{shot.line}</p>

                  {/*
                    Cells stretch to the tallest in the row, and a two-line `line`
                    on a narrow viewport makes them uneven. Centring the frame in
                    the leftover space keeps the row's top AND bottom edges flush
                    instead of ragged.
                  */}
                  <div className="mt-4 flex flex-1 items-center">
                    {/* The art's base surface is `fill-card` and the card behind
                        it is `bg-card`, so the well needs a tint that separates
                        in BOTH themes: `bg-muted` collapses onto card in dark,
                        `bg-background` collapses onto it in light. */}
                    <div className="w-full overflow-hidden rounded-xl bg-brand/5">
                      <shot.Illustration
                        // Timing is an explicit arbitrary PROPERTY, not the
                        // shorthand arbitrary `duration-*` utility: Tailwind 3
                        // resolves that shorthand against both the transition
                        // and the animation scale and warns it is ambiguous
                        // (it warns on the string anywhere in scanned content,
                        // comments included — so don't spell it out here).
                        className="block transition-transform [transition-duration:350ms] ease-out group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
                      />
                    </div>
                  </div>
                </Link>
              </CardSpotlight>
            ))}
          </ResponsiveCarousel>
        </div>
      </div>
    </section>
  );
}
