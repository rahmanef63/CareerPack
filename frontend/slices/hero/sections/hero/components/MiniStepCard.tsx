import type { MiniStepRenderable } from "../types/hero.types";

interface MiniStepCardProps {
  step: MiniStepRenderable;
}

/** One mini step-card in the "Langkah menuju tawaran" strip. */
export function MiniStepCard({ step }: MiniStepCardProps) {
  const Icon = step.icon;

  return (
    <div className="group relative z-10 flex flex-col items-start gap-3 bg-landing-paper">
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform duration-200 group-hover:scale-110 ${step.bgClassName}`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="font-semibold text-landing-ink">{step.title}</p>
      <p className="text-sm text-landing-muted">{step.description}</p>
    </div>
  );
}
