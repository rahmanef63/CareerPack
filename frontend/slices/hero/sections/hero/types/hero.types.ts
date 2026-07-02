import type { LucideIcon } from "lucide-react";

/** One item in the left-column trust checklist row. Icon is uniform, so no config split needed. */
export interface TrustPoint {
  id: string;
  label: string;
}

/** Indonesian copy for one mini step-card. Visuals (icon/color) live in config, merged by a hook. */
export interface MiniStepContent {
  id: string;
  title: string;
  description: string;
}

/** Presentation for one mini step-card, keyed by the same id as its content. */
export interface MiniStepVisual {
  id: string;
  icon: LucideIcon;
  /** Tailwind background class for the icon chip, e.g. "bg-primary". */
  bgClassName: string;
}

/** Render-ready mini step — content + visual merged by useHeroContent. */
export interface MiniStepRenderable extends MiniStepContent {
  icon: LucideIcon;
  bgClassName: string;
}

/** Indonesian label for one mini-section on the resume mock card (desk collage). */
export interface ResumeSectionContent {
  id: string;
  label: string;
}

/** Fake text-line bar widths for one resume mini-section — layout numbers, not copy. */
export interface ResumeSectionVisual {
  id: string;
  lineWidths: string[];
}

/** Render-ready resume mini-section — content + line widths merged by useHeroContent. */
export interface ResumeSectionRenderable extends ResumeSectionContent {
  lineWidths: string[];
}

/** One row in the notebook checklist card (desk collage). `done` is data, not presentation. */
export interface ChecklistRowItem {
  id: string;
  label: string;
  done: boolean;
}

/** Status of one row in the application tracker card (desk collage). */
export type ApplicationStatus = "Interview" | "Ditinjau" | "Tersimpan";

/** Content for one row in the "Lamaran Saya" tracker card — illustrative example, not a real user. */
export interface ApplicationRowContent {
  id: string;
  role: string;
  company: string;
  status: ApplicationStatus;
}

/** Render-ready tracker row — content + status badge className merged by useHeroContent. */
export interface ApplicationRowRenderable extends ApplicationRowContent {
  badgeClassName: string;
}
