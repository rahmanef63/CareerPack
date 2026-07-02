import { RESUME_CARD_NAME, RESUME_CARD_ROLE } from "../constants/hero.constants";
import type { ResumeSectionRenderable } from "../types/hero.types";

interface ResumeMockCardProps {
  className: string;
  sections: ResumeSectionRenderable[];
}

/** Desk collage card (a) — a resume mock illustrating the CV-generator feature. */
export function ResumeMockCard({ className, sections }: ResumeMockCardProps) {
  return (
    <div
      className={`rounded-2xl border border-landing-line bg-landing-card p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:rotate-0 hover:shadow-2xl hover:z-40 ${className}`}
    >
      <p className="font-display text-xl text-landing-ink">{RESUME_CARD_NAME}</p>
      <p className="text-sm text-landing-muted">{RESUME_CARD_ROLE}</p>

      <div className="mt-5 space-y-4">
        {sections.map((section) => (
          <div key={section.id}>
            <p className="text-[10px] font-bold tracking-widest text-landing-terra">{section.label}</p>
            <div className="mt-2 space-y-1.5">
              {section.lineWidths.map((width, index) => (
                <div key={index} className={`h-2 rounded-full bg-landing-line/70 ${width}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
