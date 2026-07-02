"use client";

import { ArrowRight } from "lucide-react";

import { Accordion } from "@/shared/components/ui/accordion";
import { Button } from "@/shared/components/ui/button";
import { useScrollReveal } from "@/slices/hero/hooks/useScrollReveal";

import { FaqAccordionItem } from "./FaqAccordionItem";
import { FaqTopicRow } from "./FaqTopicRow";
import { useFaqSection } from "../hooks/useFaqSection";

export function FaqSection() {
  const sectionRef = useScrollReveal<HTMLElement>();
  const { entries, topics, supportHref, revealDelay } = useFaqSection();

  return (
    <section ref={sectionRef} className="bg-landing-paper-2 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[0.55fr_1fr]">
          {/* LEFT — intro, support callout, topic list */}
          <div>
            <span
              className="animate-on-scroll inline-block text-xs font-semibold uppercase tracking-widest text-landing-blue opacity-0"
              style={revealDelay(0)}
            >
              FAQ — Pertanyaan Umum
            </span>

            <h2
              className="animate-on-scroll mt-4 font-display text-3xl font-semibold tracking-tight text-landing-ink opacity-0 sm:text-4xl"
              style={revealDelay(1)}
            >
              Semua Jawaban, <span className="text-landing-blue">Satu Tempat.</span>
            </h2>

            <p
              className="animate-on-scroll mt-4 text-landing-muted opacity-0"
              style={revealDelay(2)}
            >
              Kumpulan pertanyaan yang paling sering ditanyakan seputar paket gratis, ATS,
              asisten AI, dan keamanan data di CareerPack.
            </p>

            <div
              className="animate-on-scroll mt-8 rounded-2xl bg-landing-blue/10 p-6 opacity-0"
              style={revealDelay(3)}
            >
              <p className="font-medium text-landing-ink">Tidak menemukan jawabannya?</p>
              <p className="mt-1 text-sm text-landing-muted">
                Tim kami siap membantu Anda.
              </p>
              <a
                href={supportHref}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-landing-blue hover:underline"
              >
                Hubungi Support
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>

            <div className="animate-on-scroll mt-10 opacity-0" style={revealDelay(4)}>
              <p className="text-xs font-semibold uppercase tracking-widest text-landing-muted">
                Topik Populer
              </p>
              <ul className="mt-4">
                {topics.map((topic) => (
                  <FaqTopicRow key={topic.id} topic={topic} />
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT — accordion panel */}
          <div>
            <div
              className="animate-on-scroll rounded-2xl border border-landing-line bg-landing-card p-8 opacity-0"
              style={revealDelay(1)}
            >
              <Accordion type="single" collapsible>
                {entries.map((entry) => (
                  <FaqAccordionItem key={entry.value} entry={entry} />
                ))}
              </Accordion>
            </div>

            <div
              className="animate-on-scroll mt-6 flex items-center justify-between rounded-2xl bg-landing-paper p-5 opacity-0"
              style={revealDelay(2)}
            >
              <p className="text-sm font-medium text-landing-ink">
                Masih ada pertanyaan lain?
              </p>
              <Button variant="outline" asChild>
                <a href={supportHref}>Hubungi Support</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
