/**
 * A single step in a persona's 4-step mini journey flow. `label` is
 * intentionally short (~2 words) — it renders under a small icon in a
 * 4-column grid, not as prose.
 */
export interface ScenarioStep {
  label: string;
}

/**
 * Illustrative usage-scenario content for one unnamed persona. Everything
 * here is copy — presentation concerns (icons, colors, animation delays)
 * live in `config/scenarioVisuals.ts` instead, keyed by `id`.
 */
export interface Scenario {
  /** Stable key, also used to look up this scenario's visual config. */
  id: string;
  /** Category badge label, e.g. "Fresh Graduate". */
  category: string;
  /** Short persona-specific headline shown next to the avatar chip. */
  headline: string;
  /** "Situasi" box copy — the persona's honest, plausible starting point. */
  situasi: string;
  /** "Tantangan" box copy — what makes that starting point hard. */
  tantangan: string;
  /** 4-step mini journey, rendered as icon + 2-word label each. */
  steps: [ScenarioStep, ScenarioStep, ScenarioStep, ScenarioStep];
  /** Closing box — worded as an aspiration/expectation, never a guarantee. */
  hasil: string;
}

/** Visual/semantic tone for the repeated Situasi / Tantangan / Hasil boxes. */
export type ScenarioInfoBoxTone = "situasi" | "tantangan" | "hasil";
