import { PROCESS_STEPS } from "../constants/process.constants";
import {
  STEP_DOT_COLOR_CLASSNAME,
  STEP_DOT_COLOR_FALLBACK,
} from "../config/process.config";
import type { ProcessStepWithConfig } from "../types/process.types";

/**
 * Single data-access seam for ProcessSection: merges the step content
 * (constants/) with per-step presentation (config/) into a render-ready
 * list, so the component just maps over the result.
 */
export function useProcessSteps(): ProcessStepWithConfig[] {
  return PROCESS_STEPS.map((step) => ({
    ...step,
    dotColorClassName: STEP_DOT_COLOR_CLASSNAME[step.id] ?? STEP_DOT_COLOR_FALLBACK,
  }));
}
