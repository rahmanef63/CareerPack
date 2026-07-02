import {
  Bell,
  BookOpen,
  Compass,
  FileCheck,
  GraduationCap,
  Map,
  MessagesSquare,
  Repeat2,
  Search,
  Send,
  Sparkles,
  Target,
  TriangleAlert,
  UserCog,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";
import type { ScenarioInfoBoxTone } from "../types/scenario";

/**
 * Presentation config per scenario id — icons, avatar color, and stagger
 * timing. Kept separate from `constants/scenarios.ts` so content edits
 * never touch layout/visual concerns and vice versa.
 */
export interface ScenarioVisualConfig {
  /** Persona avatar-chip icon. */
  personaIcon: LucideIcon;
  /** Avatar chip background — a fixed landing-* token per persona. */
  avatarClassName: string;
  /** Persona accent used to tint the category badge + step-flow icons. */
  accentTextClassName: string;
  /** One icon per journey step, in the same order as `Scenario.steps`. */
  stepIcons: [LucideIcon, LucideIcon, LucideIcon, LucideIcon];
  /** Base scroll-reveal delay (seconds) for this card's own stagger group. */
  cardDelaySeconds: number;
}

export const SCENARIO_VISUALS: Record<string, ScenarioVisualConfig> = {
  "fresh-graduate": {
    personaIcon: GraduationCap,
    avatarClassName: "bg-landing-violet",
    accentTextClassName: "text-landing-violet",
    stepIcons: [UserRoundPlus, BookOpen, MessagesSquare, Send],
    cardDelaySeconds: 0.1,
  },
  "career-switcher": {
    personaIcon: Repeat2,
    avatarClassName: "bg-landing-blue",
    accentTextClassName: "text-landing-blue",
    stepIcons: [Map, Sparkles, UserCog, Search],
    cardDelaySeconds: 0.2,
  },
  "active-seeker": {
    personaIcon: Target,
    avatarClassName: "bg-landing-terra",
    accentTextClassName: "text-landing-terra",
    stepIcons: [FileCheck, MessagesSquare, Search, Bell],
    cardDelaySeconds: 0.3,
  },
};

/** Icon + tone styling for the repeated Situasi/Tantangan/Hasil info boxes. */
export interface ScenarioToneStyle {
  icon: LucideIcon;
  boxClassName: string;
  labelClassName: string;
}

export const SCENARIO_TONE_STYLES: Record<ScenarioInfoBoxTone, ScenarioToneStyle> = {
  situasi: {
    icon: Compass,
    boxClassName: "border-landing-line bg-landing-paper-2",
    labelClassName: "text-landing-blue",
  },
  tantangan: {
    icon: TriangleAlert,
    boxClassName: "border-landing-terra-soft/60 bg-landing-terra-soft/30",
    labelClassName: "text-landing-terra",
  },
  hasil: {
    icon: Sparkles,
    boxClassName: "border-landing-line bg-landing-mint",
    labelClassName: "text-landing-green",
  },
};

/** Grid layout numbers — not content, so they live here rather than constants. */
export const SCENARIO_GRID = {
  columns: "grid-cols-1 md:grid-cols-3",
  stepColumns: "grid-cols-4",
} as const;
