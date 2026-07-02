import {
  APPLICATION_ROWS,
  MINI_STEPS,
  RESUME_SECTIONS,
} from "../constants/hero.constants";
import {
  APPLICATION_STATUS_BADGE,
  MINI_STEP_VISUALS,
  RESUME_SECTION_LINE_WIDTHS,
} from "../config/hero.config";
import type {
  ApplicationRowRenderable,
  MiniStepRenderable,
  ResumeSectionRenderable,
} from "../types/hero.types";

/**
 * Single data-access seam for the hero section: merges Indonesian copy
 * (constants) with presentation config (icon/color/layout numbers) into
 * render-ready shapes, keyed by id. No client-side state — safe to call
 * from render.
 */
export function useHeroContent() {
  const miniSteps: MiniStepRenderable[] = MINI_STEPS.map((step) => ({
    ...step,
    ...MINI_STEP_VISUALS[step.id],
  }));

  const resumeSections: ResumeSectionRenderable[] = RESUME_SECTIONS.map((section) => ({
    ...section,
    lineWidths: RESUME_SECTION_LINE_WIDTHS[section.id] ?? [],
  }));

  const applicationRows: ApplicationRowRenderable[] = APPLICATION_ROWS.map((row) => ({
    ...row,
    badgeClassName: APPLICATION_STATUS_BADGE[row.status],
  }));

  return { miniSteps, resumeSections, applicationRows };
}
