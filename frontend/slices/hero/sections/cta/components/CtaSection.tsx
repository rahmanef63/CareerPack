"use client";

import { ArrowRight } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { useScrollReveal } from "@/slices/hero/hooks/useScrollReveal";

import { CtaBenefitRow } from "./CtaBenefitRow";
import { useCtaContent } from "../hooks/useCtaContent";
import { CTA_LAYOUT } from "../config/cta.config";
import { CTA_BUTTON_LABEL, CTA_EYEBROW, CTA_HEADING, CTA_LEAD } from "../constants/cta.constants";

interface CtaSectionProps {
  onGetStarted: () => void;
}

export function CtaSection({ onGetStarted }: CtaSectionProps) {
  const sectionRef = useScrollReveal<HTMLElement>();
  const { benefits, revealDelay } = useCtaContent();

  return (
    <section ref={sectionRef} className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`grid gap-12 rounded-3xl bg-gradient-to-br from-muted to-warning/15 p-10 lg:p-14 ${CTA_LAYOUT.gridColsClassName}`}
        >
          {/* LEFT — framing copy + primary CTA */}
          <div>
            <span
              className="animate-on-scroll inline-block text-xs font-semibold uppercase tracking-widest text-warning-text opacity-0"
              style={revealDelay(0)}
            >
              {CTA_EYEBROW}
            </span>

            <h2
              className="animate-on-scroll mt-4 font-display text-3xl font-semibold tracking-tight text-foreground opacity-0 sm:text-4xl"
              style={revealDelay(1)}
            >
              {CTA_HEADING}
            </h2>

            <p
              className="animate-on-scroll mt-4 max-w-md text-muted-foreground opacity-0"
              style={revealDelay(2)}
            >
              {CTA_LEAD}
            </p>

            <div className="animate-on-scroll mt-8 opacity-0" style={revealDelay(3)}>
              <Button
                size="lg"
                onClick={onGetStarted}
                className="bg-primary text-white hover:bg-primary/90"
              >
                {CTA_BUTTON_LABEL}
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* RIGHT — benefits card */}
          <div
            className="animate-on-scroll rounded-2xl border border-border bg-card p-6 opacity-0"
            style={revealDelay(2)}
          >
            <div className="flex flex-col gap-5">
              {benefits.map((benefit) => (
                <CtaBenefitRow key={benefit.id} benefit={benefit} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
