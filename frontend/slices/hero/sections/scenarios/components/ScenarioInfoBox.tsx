import { cn } from "@/shared/lib/utils";
import { SCENARIO_TONE_STYLES } from "../config/scenarioVisuals";
import type { ScenarioInfoBoxTone } from "../types/scenario";

interface ScenarioInfoBoxProps {
  tone: ScenarioInfoBoxTone;
  label: string;
  text: string;
}

/**
 * Repeated "Situasi" / "Tantangan" / "Hasil yang Diharapkan" box inside a
 * scenario card. Tone drives icon + color from `config/scenarioVisuals.ts`;
 * label/text are content passed in by the caller.
 */
export function ScenarioInfoBox({ tone, label, text }: ScenarioInfoBoxProps) {
  const style = SCENARIO_TONE_STYLES[tone];
  const Icon = style.icon;

  return (
    <div className={cn("rounded-xl border p-3", style.boxClassName)}>
      <p
        className={cn(
          "mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide",
          style.labelClassName
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {label}
      </p>
      <p className="text-sm leading-relaxed text-landing-ink/80">{text}</p>
    </div>
  );
}
