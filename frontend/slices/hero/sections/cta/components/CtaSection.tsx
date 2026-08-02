"use client";

import { ArrowRight } from "lucide-react";

import { SpotDocuments } from "@/shared/components/illustrations/features";
import { Meteors } from "@/shared/components/ui/aceternity";
import { Button } from "@/shared/components/ui/button";
import { useScrollReveal } from "@/slices/hero/hooks/useScrollReveal";

import { CTA_BUTTON_LABEL, CTA_HEADING, CTA_LEAD } from "../constants/cta.constants";

interface CtaSectionProps {
  onGetStarted: () => void;
}

// ponytail: one stagger helper is not a hook.
const revealDelay = (i: number) => ({ animationDelay: `${(i * 0.1).toFixed(1)}s` });

export function CtaSection({ onGetStarted }: CtaSectionProps) {
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section ref={sectionRef} className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-muted to-warning/15 p-10 lg:p-14">
          {/* Slow specular sweep. Two elements on purpose: .animate-sheen owns
              `transform` for the travel, so the skew has to live on a child or
              the keyframe would overwrite it. w-1/2 is the minimum width that
              lets the 220% end-frame carry the band fully off the right edge —
              anything narrower parks it mid-panel and snaps on loop. */}
          <span
            aria-hidden="true"
            className="animate-sheen pointer-events-none absolute -inset-y-24 left-0 w-1/2"
          >
            <span className="block h-full w-full -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/10" />
          </span>

          {/* Aceternity meteors, layered under the content and over the sheen.
              The ported version uses a fixed track table instead of Math.random,
              so server and client markup match, and it kills its own animation
              under prefers-reduced-motion rather than letting the global
              0.01ms override fling every meteor to opacity 0. Count kept low —
              the sheen is already moving on this panel. */}
          <Meteors count={9} containerClassName="rounded-3xl" />

          <div className="relative flex items-center gap-10">
            <div className="max-w-xl">
              <h2
                className="animate-on-scroll font-display text-3xl font-semibold tracking-tight text-foreground opacity-0 sm:text-4xl"
                style={revealDelay(0)}
              >
                {CTA_HEADING}
              </h2>

              <p
                className="animate-on-scroll mt-4 text-muted-foreground opacity-0"
                style={revealDelay(1)}
              >
                {CTA_LEAD}
              </p>

              <div className="animate-on-scroll mt-8 opacity-0" style={revealDelay(2)}>
                <Button
                  size="lg"
                  onClick={onGetStarted}
                  // No bg/text override: the default variant is already
                  // `bg-primary text-primary-foreground hover:bg-primary/90`.
                  // Spelling it out here only pinned the label to white, which
                  // a pale-`--primary` preset renders unreadable.
                  className="shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {CTA_BUTTON_LABEL}
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
            </div>

            {/* Decorative. Hidden under lg so it never squeezes the copy.
                animate-on-scroll and animate-float-slow sit on DIFFERENT
                elements — both are `animation`, so sharing one node would make
                the reveal cancel the drift. */}
            <div
              className="animate-on-scroll ml-auto hidden shrink-0 opacity-0 lg:block"
              style={revealDelay(3)}
              aria-hidden="true"
            >
              <div className="animate-float-slow rounded-2xl border border-border bg-card p-3 shadow-lg">
                {/* The art's base surface is `fill-card` and so is the frame, so
                    the well carries a brand wash — the one tint that separates
                    in both themes. Width lives here; the SVG is `h-auto w-full`
                    at its own 900:711 ratio, so nothing crops it. */}
                <div className="w-[240px] overflow-hidden rounded-xl bg-brand/5 xl:w-[280px]">
                  <SpotDocuments className="block" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
