"use client";

import { ArrowRight, CheckCircle2, Play } from "lucide-react";

import { ParangPattern } from "@/shared/components/decor/ParangPattern";
import { HoverBorderGradient, Spotlight } from "@/shared/components/ui/aceternity";
import { Button } from "@/shared/components/ui/button";

import { useScrollReveal } from "@/slices/hero/hooks/useScrollReveal";

import {
  CTA_DEMO_LABEL,
  CTA_DEMO_LOADING_LABEL,
  CTA_PRIMARY_LABEL,
  ENGLISH_TAGLINE,
  HEADLINE_HIGHLIGHT,
  HEADLINE_PREFIX,
  LEAD_PARAGRAPH,
  TRUST_POINTS,
} from "../constants/hero.constants";
import { useHeroActions } from "../hooks/useHeroActions";
import { HeroCardDeck } from "./HeroCardDeck";

interface HeroSectionProps {
  onGetStarted: () => void;
}

/**
 * Radial fade for the batik texture so it only reads behind the card deck and
 * never sits under body copy, where it would eat contrast. Inline (like
 * Marquee's edge fade) because the two prefixed properties must stay in sync.
 */
const TEXTURE_MASK =
  "radial-gradient(60% 55% at 78% 42%, black, transparent 72%)";

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const sectionRef = useScrollReveal<HTMLElement>();
  const { isDemoLoading, handleDemo } = useHeroActions();

  return (
    // `isolate` is load-bearing, not decoration: the deck's cards are z-30, and
    // so is the sticky MarketingHeader. Without a stacking context here both
    // resolve in the ROOT context, tree order breaks the tie, and the card
    // paints over the header while the hero scrolls past it. Isolating scopes
    // the deck's z-indices to this section (CtaSection does the same).
    <section ref={sectionRef} className="relative isolate overflow-hidden bg-background">
      {/* Atmosphere — batik-parang texture + one Aceternity spotlight sweep,
          all decorative. The content wrapper below is `relative` so it paints
          on top of these absolutely-positioned layers.

          The two hand-rolled blurred circles that used to live here are gone:
          Spotlight is the same idea done properly (one diagonal blurred ellipse
          instead of two symmetric blobs), and stacking both just muddied the
          upper-left corner. The section's `overflow-hidden` crops the sweep. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{ maskImage: TEXTURE_MASK, WebkitMaskImage: TEXTURE_MASK }}
        >
          <ParangPattern className="text-brand/20" />
        </div>
        {/* Sweeps down-right, i.e. toward the card deck — the texture mask is
            already anchored at 78%/42% for the same reason. */}
        <Spotlight className="-top-40 left-0 md:-top-24 md:left-52" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left column.
              Deliberately NOT `.animate-on-scroll opacity-0`, unlike Showcase /
              Toolkit / Cta below. This block is above the fold by construction,
              so there is nothing to reveal — and the only thing that ever
              removed that `opacity-0` was a client IntersectionObserver
              (useScrollReveal), which meant the headline, the lead and BOTH CTAs
              stayed invisible until the whole route bundle hydrated. The page
              painted a header, a batik wash and an illustration next to an empty
              column. Scroll-reveal is for content the user scrolls to. */}
          <div className="space-y-8">
            {/* `text-balance` is applied and verified in the served CSS, but it
                does NOT change this headline at desktop width — "untuk" still
                lands alone on line 3, because with words this long that IS the
                balanced wrap. Kept anyway: Google Translate replaces this text
                wholesale with 12 different languages of wildly different length,
                and balance is what keeps those from wrapping badly. Do not
                force the Indonesian wrap with a non-breaking space — "Karir
                Impian." carries the highlight underline and must not split. */}
            <h1 className="font-display text-balance text-5xl font-extrabold leading-[0.96] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              {HEADLINE_PREFIX}
              <span className="relative inline-block">
                <span className="relative z-10">{HEADLINE_HIGHLIGHT}</span>
                <span aria-hidden className="absolute inset-x-0 bottom-1 -z-0 h-[0.3em] -rotate-1 bg-primary/25" />
              </span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {LEAD_PARAGRAPH}
            </p>

            {/* See ENGLISH_TAGLINE for why exactly one line, and why it opts out
                of translation.

                Full `text-muted-foreground`, not a faded variant of it: at /80
                this rendered as the palest text on the page, so the one line
                written for readers who cannot read the rest of it was also the
                hardest to read. Smaller than the Indonesian lead is the right
                hierarchy; fainter than it is not. */}
            <p
              translate="no"
              className="notranslate max-w-xl text-base leading-relaxed text-muted-foreground"
            >
              {ENGLISH_TAGLINE}
            </p>

            <div className="flex flex-wrap gap-4">
              {/* The ONE rotating-border element on the landing page. It marks
                  the single primary action; putting the same ring on the demo
                  button beside it would cancel the hierarchy it exists to
                  create. Sizing mirrors `<Button size="lg">` (h-10, px-8,
                  text-sm) so the pair lines up: h-10 outer minus the 1px ring
                  the container's `p-px` reserves leaves h-full for the panel. */}
              <HoverBorderGradient
                as="button"
                type="button"
                onClick={onGetStarted}
                containerClassName="h-10 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                // `text-primary-foreground`, not `text-white`: several tweakcn
                // presets ship a pale `--primary` (pastel/mono families), and
                // white-on-pale made the page's ONE primary CTA unreadable.
                className="h-full rounded-xl bg-primary px-8 py-0 text-sm text-primary-foreground group-hover/hbg:bg-primary/90"
              >
                {CTA_PRIMARY_LABEL}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </HoverBorderGradient>
              <Button size="lg" variant="outline" onClick={handleDemo} disabled={isDemoLoading}>
                <Play className="mr-1 h-5 w-5" aria-hidden />
                {isDemoLoading ? CTA_DEMO_LOADING_LABEL : CTA_DEMO_LABEL}
              </Button>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {TRUST_POINTS.map((label) => (
                <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right column — the interactive product deck. No
              `.animate-on-scroll opacity-0` here on purpose: the front card is
              the largest thing above the fold and must not wait on an
              IntersectionObserver. Its art is inline SVG now, so it costs zero
              network requests and paints with the document. */}
          <HeroCardDeck onDemo={handleDemo} isDemoLoading={isDemoLoading} />
        </div>
      </div>
    </section>
  );
}
