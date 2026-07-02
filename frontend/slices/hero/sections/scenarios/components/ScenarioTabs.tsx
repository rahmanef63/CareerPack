import { cn } from "@/shared/lib/utils";
import type { ScenarioViewModel } from "../hooks/useScenarios";
import { chipIconTextClassName } from "../../../lib/chipContrast";

interface ScenarioTabsProps {
  scenarios: ScenarioViewModel[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

/**
 * Persona pill switcher for the scenarios section — one tab per scenario,
 * active tab tinted with that persona's own accent color (same token used
 * for its avatar chip) so the tab row previews which card is showing below.
 */
export function ScenarioTabs({ scenarios, activeIndex, onSelect }: ScenarioTabsProps) {
  return (
    <div role="tablist" className="mt-8 flex flex-wrap justify-center gap-2">
      {scenarios.map((scenario, index) => {
        const isActive = index === activeIndex;
        const PersonaIcon = scenario.personaIcon;
        const activeIconTextClassName = chipIconTextClassName(scenario.avatarClassName);

        return (
          <button
            key={scenario.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(index)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? cn("border-transparent", activeIconTextClassName, scenario.avatarClassName)
                : "border-border bg-muted text-muted-foreground hover:bg-background hover:text-foreground"
            )}
          >
            <PersonaIcon className="h-4 w-4 shrink-0" aria-hidden />
            {scenario.category}
          </button>
        );
      })}
    </div>
  );
}
