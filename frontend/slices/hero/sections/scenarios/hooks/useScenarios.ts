import { SCENARIOS } from "../constants/scenarios";
import { SCENARIO_VISUALS, type ScenarioVisualConfig } from "../config/scenarioVisuals";
import type { Scenario } from "../types/scenario";

export interface ScenarioViewModel extends Scenario, ScenarioVisualConfig {}

/**
 * Single data-access seam for the scenarios section: merges the typed
 * content (`constants/scenarios.ts`) with its presentation config
 * (`config/scenarioVisuals.ts`) into one render-ready list. No client-side
 * state involved — the scroll-reveal behavior itself is handled by the
 * shared `useScrollReveal` hook in the component.
 */
export function useScenarios(): ScenarioViewModel[] {
  return SCENARIOS.map((scenario) => ({
    ...scenario,
    ...SCENARIO_VISUALS[scenario.id],
  }));
}
