import { Quote } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import type { ScenarioViewModel } from "../hooks/useScenarios";
import { ScenarioInfoBox } from "./ScenarioInfoBox";
import { ScenarioStepFlow } from "./ScenarioStepFlow";

interface ScenarioCardProps {
  scenario: ScenarioViewModel;
}

export function ScenarioCard({ scenario }: ScenarioCardProps) {
  const PersonaIcon = scenario.personaIcon;

  return (
    <div
      className="animate-on-scroll opacity-0 rounded-2xl border border-landing-line bg-landing-card p-6"
      style={{ animationDelay: `${scenario.cardDelaySeconds}s` }}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-landing-paper-2",
            scenario.avatarClassName
          )}
        >
          <PersonaIcon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <Badge variant="outline" className={cn("border-landing-line bg-landing-paper", scenario.accentTextClassName)}>
            {scenario.category}
          </Badge>
          <h3 className="mt-1.5 font-display text-base font-semibold leading-snug text-landing-ink">
            {scenario.headline}
          </h3>
        </div>
      </div>

      <p className="mt-4 flex gap-2 text-sm italic leading-relaxed text-landing-muted">
        <Quote className="h-4 w-4 shrink-0 text-landing-line" aria-hidden />
        <span>&ldquo;{scenario.quote}&rdquo;</span>
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <ScenarioInfoBox tone="situasi" label="Situasi" text={scenario.situasi} />
        <ScenarioInfoBox tone="tantangan" label="Tantangan" text={scenario.tantangan} />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-landing-muted">Alur Perjalanan</p>
        <ScenarioStepFlow
          steps={scenario.steps}
          icons={scenario.stepIcons}
          accentTextClassName={scenario.accentTextClassName}
        />
      </div>

      <div className="mt-5">
        <ScenarioInfoBox tone="hasil" label="Hasil yang Diharapkan" text={scenario.hasil} />
      </div>
    </div>
  );
}
