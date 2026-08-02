"use client";

import {
  CvGenerator,
  PortfolioBuilder,
  SkillRoadmap,
} from "@/shared/components/illustrations/features";
import { Marquee } from "@/shared/components/marketing/Marquee";
import { GridBackground } from "@/shared/components/ui/aceternity";
import { cn } from "@/shared/lib/utils";
import { useScrollReveal } from "@/slices/hero/hooks/useScrollReveal";

// ponytail: local copy strings, no constants/ folder for four lines.
const SECTION_HEADING = "Sekilas isi CareerPack.";
const SECTION_LEAD = "Satu akun, semua alat karier Anda.";

/**
 * Meaningful copy, NOT decoration — the Marquee aria-hides only its second
 * copy, so a screen reader announces this list exactly once. Keep it out of
 * any aria-hidden wrapper.
 */
const PROOF_POINTS = [
  "Gratis selamanya",
  "Tanpa kartu kredit",
  "Data Anda tidak dijual",
  "CV siap ATS",
  "Lacak semua lamaran",
  "Latihan wawancara",
  "Peta skill personal",
  "Portofolio siap dibagikan",
];

/**
 * Tile geometry is an explicit height+width pair, not `h-* aspect-*`, so a row's
 * width never depends on the browser transferring aspect-ratio into an auto
 * width. Both pairs are exactly 16:9 — the viewBox every tile's art uses — so
 * the inline SVG fills its well exactly, no letterbox and nothing to crop.
 *
 * A row's ONE copy must stay wider than the marquee VIEWPORT or the loop shows a
 * gap at the seam, and that viewport is not the screen: this strip lives in a
 * `max-w-5xl px-4/sm:px-6/lg:px-8` box, so it is widest at a 1023px window
 * (1023 - 48 = 975px) and caps at 960px on every desktop, 1920 included. Three
 * tiles at 320 + 24px of padding = 1032px clears both, and 3 x (208 + 24) =
 * 696px clears the 607px worst case below `sm`. Shrink either width — or add a
 * breakpoint that lands under ~301px above `sm` — and the seam gap is back.
 */
const TILE = "h-[117px] w-[208px] sm:h-[180px] sm:w-[320px]";

/**
 * THREE tiles, and deliberately the three tools nothing else on this page shows.
 * HeroCardDeck and ToolkitSection both render checklist, AI and interview, and
 * ToolkitSection also has the tracker; CV, roadmap and portfolio appear only here.
 *
 * The two that left were HeroProductUi and HeroOnboarding — generic marketing
 * abstracts naming no tool, and at 148 and 126 SVG elements the two heaviest
 * things in the section. Both copies of both cost 560 of the section's 1116
 * rendered elements, and the whole strip is `aria-hidden`, so that weight bought
 * decoration only. Nothing is lost that the proof points above do not already
 * say in words: "CV siap ATS", "Peta skill personal", "Portofolio siap
 * dibagikan". Fewer-and-bigger also answers what the five-tile row actually
 * looked like — a pale wireframe blur rather than product.
 */
const TILES = [CvGenerator, SkillRoadmap, PortfolioBuilder];

// ponytail: one stagger helper is not a hook. Mirrors CtaSection.
const revealDelay = (i: number) => ({ animationDelay: `${(i * 0.1).toFixed(1)}s` });

export function ShowcaseSection() {
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden border-t border-border bg-background py-16 sm:py-20"
    >
      {/* Aceternity grid, faded at the edges — gives the strip a ground instead
          of a flat fill. Uses the ported layer, not upstream's demo wrapper: the
          upstream fade is a solid white/black plate on top, which only works if
          the page background is pure white or pure black. */}
      <GridBackground size="lg" lineClassName="text-border/70" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="animate-on-scroll max-w-xl opacity-0" style={revealDelay(0)}>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {SECTION_HEADING}
          </h2>
          <p className="mt-3 text-muted-foreground">{SECTION_LEAD}</p>
        </div>

        {/* `marquee-wrap-static`: this strip carries real copy, so under
            prefers-reduced-motion — where the track freezes at 0 — it wraps into
            plain lines instead of hiding five of the eight points behind a
            horizontal scroll no keyboard reaches. Decorative strips below skip
            the class and just freeze. */}
        <div className="animate-on-scroll mt-10 opacity-0" style={revealDelay(1)}>
          <Marquee durationSec={38} className="marquee-wrap-static">
            {PROOF_POINTS.map((point) => (
              // gap-4 here is INSIDE a tile, which is allowed. What must never
              // carry a gap is the track or a copy wrapper.
              <span
                key={point}
                className="flex shrink-0 items-center gap-4 px-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                {point}
                <span aria-hidden="true" className="text-brand/50">
                  &bull;
                </span>
              </span>
            ))}
          </Marquee>
        </div>

        {/* Decorative texture — the heading above carries the meaning, so the
            thumbnails stay out of the accessibility tree entirely. */}
        <div
          className="animate-on-scroll mt-8 opacity-0"
          style={revealDelay(2)}
          aria-hidden="true"
        >
          {/* 34s, not the old 46s: duration is per PASS, so a shorter copy at
              the same seconds drifts slower. 1032px / 34s holds the ~30px/s the
              1400px five-tile row ran at. */}
          <Marquee durationSec={34}>
            {TILES.map((Illustration, i) => (
              // px-3 lives on the TILE. Never a gap-* on the Marquee track or on
              // a copy wrapper — see the spacing rule in Marquee.tsx. Each tile
              // also has to stay a DIRECT flex child of the copy so the track
              // measures at max-content; an array of elements flattens, a
              // wrapper element would not.
              // py-4 is pure headroom: the viewport clips overflow, so without it
              // the hover scale + shadow get shaved off top and bottom. Vertical
              // padding does not touch the horizontal loop math.
              <div key={i} className="shrink-0 px-3 py-4">
                <div
                  className={cn(
                    // Explicit arbitrary PROPERTY for the timing, not the
                    // shorthand arbitrary `duration-*` utility — that shorthand
                    // is ambiguous in Tailwind 3 (transition and animation scales
                    // both claim it) and warns at build time wherever the string
                    // appears, comments included.
                    "overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-sm transition-all [transition-duration:250ms] ease-out hover:rotate-0 hover:scale-[1.04] hover:border-brand/40 hover:shadow-lg",
                    i % 2 === 0 ? "-rotate-2" : "rotate-1",
                  )}
                >
                  {/* The art's own base surface is `fill-card`, so the well
                      behind it must NOT also be `bg-card`. A brand wash is the
                      one tint that separates in both themes — `bg-muted`
                      collapses onto card in dark, `bg-background` collapses onto
                      it in light. */}
                  <div className={cn("overflow-hidden rounded-xl bg-brand/5", TILE)}>
                    <Illustration className="h-full w-full" />
                  </div>
                </div>
              </div>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}
