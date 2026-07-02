"use client";

import type { ComponentType } from "react";
import { useScrollReveal } from "@/slices/hero/hooks/useScrollReveal";
import { StepDot } from "./StepDot";
import { ProfilePreview } from "./previews/ProfilePreview";
import { DocumentPreview } from "./previews/DocumentPreview";
import { InterviewPreview } from "./previews/InterviewPreview";
import { TrackingPreview } from "./previews/TrackingPreview";
import { useProcessSteps } from "../hooks/useProcessSteps";
import { REVEAL_DELAY_STEP_SECONDS } from "../config/process.config";

/** Step id -> its mock preview renderer. Presentation wiring, not content. */
const STEP_PREVIEW_COMPONENT: Record<number, ComponentType> = {
  1: ProfilePreview,
  2: DocumentPreview,
  3: InterviewPreview,
  4: TrackingPreview,
};

export function ProcessSection() {
  const sectionRef = useScrollReveal<HTMLElement>();
  const steps = useProcessSteps();

  return (
    <section ref={sectionRef} className="bg-background py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-16 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
        <div>
          <span
            className="animate-on-scroll inline-flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-primary opacity-0"
            style={{ animationDelay: "0.1s" }}
          >
            Cara Kerja
          </span>
          <h2
            className="animate-on-scroll mt-4 font-display text-3xl font-semibold text-foreground opacity-0 sm:text-4xl"
            style={{ animationDelay: "0.2s" }}
          >
            Dari Profil Kosong Sampai Tawaran Diterima
          </h2>
          <p
            className="animate-on-scroll mt-4 text-muted-foreground opacity-0"
            style={{ animationDelay: "0.3s" }}
          >
            Tidak perlu pindah-pindah alat — empat langkah ini sudah mencakup
            seluruh perjalanan pencarian kerja Anda.
          </p>
          <p
            className="animate-on-scroll mt-6 font-display text-lg italic text-primary opacity-0"
            style={{ animationDelay: "0.4s" }}
          >
            4 langkah. Satu tujuan: karir impianmu.
          </p>
        </div>

        <div className="relative flex flex-col gap-12">
          <div
            aria-hidden
            className="absolute bottom-7 left-7 top-7 z-0 border-l-2 border-dashed border-border"
          />

          {steps.map((step, index) => {
            const Preview = STEP_PREVIEW_COMPONENT[step.id];
            return (
              <div
                key={step.id}
                className="animate-on-scroll flex gap-6 opacity-0"
                style={{ animationDelay: `${(index + 1) * REVEAL_DELAY_STEP_SECONDS}s` }}
              >
                <StepDot id={step.id} colorClassName={step.dotColorClassName} />
                <div className="flex-1 pt-2 sm:grid sm:grid-cols-2 sm:items-start sm:gap-6">
                  <div>
                    <h3 className="font-medium text-foreground">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <Preview />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
