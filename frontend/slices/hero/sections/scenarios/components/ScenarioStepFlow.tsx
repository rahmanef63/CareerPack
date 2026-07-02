import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { SCENARIO_GRID } from "../config/scenarioVisuals";
import type { ScenarioStep } from "../types/scenario";

interface ScenarioStepFlowProps {
  steps: readonly [ScenarioStep, ScenarioStep, ScenarioStep, ScenarioStep];
  icons: readonly [LucideIcon, LucideIcon, LucideIcon, LucideIcon];
  accentTextClassName: string;
}

/** Persona-specific 4-step mini journey — icon + 2-word label per step. */
export function ScenarioStepFlow({ steps, icons, accentTextClassName }: ScenarioStepFlowProps) {
  return (
    <div className={cn("grid gap-2", SCENARIO_GRID.stepColumns)}>
      {steps.map((step, index) => {
        const Icon = icons[index];
        return (
          <div key={step.label} className="flex flex-col items-center gap-1.5 text-center">
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted",
                accentTextClassName
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-[11px] font-medium leading-tight text-foreground">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
