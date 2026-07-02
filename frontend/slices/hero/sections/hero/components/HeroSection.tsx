"use client";

import { ArrowRight, CheckCircle2, Play } from "lucide-react";

import { Button } from "@/shared/components/ui/button";

import { useScrollReveal } from "@/slices/hero/hooks/useScrollReveal";

import {
  CTA_DEMO_LABEL,
  CTA_DEMO_LOADING_LABEL,
  CTA_PRIMARY_LABEL,
  HEADLINE_HIGHLIGHT,
  HEADLINE_PREFIX,
  LEAD_PARAGRAPH,
  EYEBROW_TEXT,
  MINI_STEPS_LABEL,
  TRUST_POINTS,
} from "../constants/hero.constants";
import { EYEBROW_ICON, REVEAL_DELAY_STEP } from "../config/hero.config";
import { useHeroActions } from "../hooks/useHeroActions";
import { useHeroContent } from "../hooks/useHeroContent";
import { DeskCollage } from "./DeskCollage";
import { MiniStepCard } from "./MiniStepCard";

interface HeroSectionProps {
  onGetStarted: () => void;
}

/** Computes a staggered `animationDelay` string for the Nth left-column block. */
function revealDelay(index: number): string {
  return `${(index * REVEAL_DELAY_STEP).toFixed(1)}s`;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const sectionRef = useScrollReveal<HTMLElement>();
  const { isDemoLoading, handleDemo } = useHeroActions();
  const { miniSteps } = useHeroContent();
  const EyebrowIcon = EYEBROW_ICON;

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-landing-paper">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left column */}
          <div className="space-y-8">
            <div
              className="animate-on-scroll flex items-center gap-2 opacity-0"
              style={{ animationDelay: revealDelay(0) }}
            >
              <EyebrowIcon className="h-5 w-5 text-landing-terra" aria-hidden />
              <span className="text-sm font-semibold uppercase tracking-widest text-landing-terra">
                {EYEBROW_TEXT}
              </span>
            </div>

            <h1
              className="animate-on-scroll font-display text-5xl font-extrabold leading-[0.96] tracking-tight text-landing-ink opacity-0 sm:text-6xl lg:text-7xl"
              style={{ animationDelay: revealDelay(1) }}
            >
              {HEADLINE_PREFIX}
              <span className="relative inline-block">
                <span className="relative z-10">{HEADLINE_HIGHLIGHT}</span>
                <span aria-hidden className="absolute inset-x-0 bottom-1 -z-0 h-[0.3em] -rotate-1 bg-landing-blue/25" />
              </span>
            </h1>

            <p
              className="animate-on-scroll max-w-xl text-lg leading-relaxed text-landing-muted opacity-0 sm:text-xl"
              style={{ animationDelay: revealDelay(2) }}
            >
              {LEAD_PARAGRAPH}
            </p>

            <div
              className="animate-on-scroll flex flex-wrap gap-4 opacity-0"
              style={{ animationDelay: revealDelay(3) }}
            >
              <Button
                size="lg"
                onClick={onGetStarted}
                className="rounded-xl bg-landing-blue text-white hover:bg-landing-blue/90"
              >
                {CTA_PRIMARY_LABEL}
                <ArrowRight className="ml-1 h-5 w-5" aria-hidden />
              </Button>
              <Button size="lg" variant="outline" onClick={handleDemo} disabled={isDemoLoading}>
                <Play className="mr-1 h-5 w-5" aria-hidden />
                {isDemoLoading ? CTA_DEMO_LOADING_LABEL : CTA_DEMO_LABEL}
              </Button>
            </div>

            <div
              className="animate-on-scroll flex flex-wrap gap-x-6 gap-y-2 opacity-0"
              style={{ animationDelay: revealDelay(4) }}
            >
              {TRUST_POINTS.map((point) => (
                <div key={point.id} className="flex items-center gap-2 text-sm text-landing-muted">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-landing-green" aria-hidden />
                  {point.label}
                </div>
              ))}
            </div>

            <div
              className="animate-on-scroll opacity-0"
              style={{ animationDelay: revealDelay(5) }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-landing-terra">
                {MINI_STEPS_LABEL}
              </p>
              <div className="relative mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-6 z-0 hidden border-t border-dashed border-landing-line sm:block"
                />
                {miniSteps.map((step) => (
                  <MiniStepCard key={step.id} step={step} />
                ))}
              </div>
            </div>
          </div>

          {/* Right column — scattered desk collage */}
          <DeskCollage />
        </div>
      </div>
    </section>
  );
}
