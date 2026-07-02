import type { MiniStepRenderable } from "../types/hero.types";
import { chipIconTextClassName } from "../../../lib/chipContrast";

interface MiniStepCardProps {
  step: MiniStepRenderable;
}

/** One mini step-card in the "Langkah menuju tawaran" strip. */
export function MiniStepCard({ step }: MiniStepCardProps) {
  const Icon = step.icon;
  const iconTextClassName = chipIconTextClassName(step.bgClassName);

  return (
    <div className="group relative z-10 flex flex-col items-start gap-3 bg-background">
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full ${iconTextClassName} transition-transform duration-200 group-hover:scale-110 ${step.bgClassName}`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="font-semibold text-foreground">{step.title}</p>
      <p className="text-sm text-muted-foreground">{step.description}</p>
    </div>
  );
}
