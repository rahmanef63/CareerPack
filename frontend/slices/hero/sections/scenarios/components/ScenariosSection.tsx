"use client";

import { Info } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useScrollReveal } from "@/slices/hero/hooks/useScrollReveal";
import { SCENARIO_GRID } from "../config/scenarioVisuals";
import { useScenarios } from "../hooks/useScenarios";
import { ScenarioCard } from "./ScenarioCard";

/**
 * Illustrative usage scenarios — successor to the old TestimonialsSection.
 * Same honesty framing (unnamed personas, explicit "not real testimonials"
 * disclaimer), expanded into a richer per-persona breakdown: situation,
 * challenge, a 4-step journey, and an aspirational (never guaranteed)
 * expected outcome.
 */
export function ScenariosSection() {
  const sectionRef = useScrollReveal<HTMLElement>();
  const scenarios = useScenarios();

  return (
    <section ref={sectionRef} className="border-t border-landing-line bg-landing-paper py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="animate-on-scroll opacity-0 text-sm font-semibold uppercase tracking-widest text-landing-blue">
            Skenario Penggunaan
          </span>
          <h2
            className="animate-on-scroll opacity-0 mt-3 font-display text-3xl font-semibold tracking-tight text-landing-ink sm:text-4xl"
            style={{ animationDelay: "0.1s" }}
          >
            Skenario Penggunaan CareerPack
          </h2>
          <p
            className="animate-on-scroll opacity-0 mt-3 text-sm leading-relaxed text-landing-muted"
            style={{ animationDelay: "0.2s" }}
          >
            Tiga situasi umum yang menggambarkan cara CareerPack dipakai, dari lulus kuliah sampai proses lamaran
            yang aktif berjalan.
          </p>

          <div
            className="animate-on-scroll opacity-0 mt-5 flex items-start gap-2 rounded-xl border border-landing-line bg-landing-paper-2 px-4 py-3 text-left text-xs leading-relaxed text-landing-muted"
            style={{ animationDelay: "0.3s" }}
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-landing-blue" aria-hidden />
            <span>
              Skenario di bawah ini adalah ilustrasi, bukan testimoni atau kutipan pengguna sungguhan — CareerPack
              masih tahap awal dan belum punya data pengguna terverifikasi. Persona sengaja tidak diberi nama, dan
              &ldquo;Hasil yang Diharapkan&rdquo; adalah ekspektasi penggunaan, bukan hasil yang dijamin.
            </span>
          </div>
        </div>

        <div className={cn("mt-12 grid gap-6", SCENARIO_GRID.columns)}>
          {scenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      </div>
    </section>
  );
}
