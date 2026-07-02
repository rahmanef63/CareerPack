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
  /** Avatar chip background — one of the app's real theme tokens per persona. */
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
    avatarClassName: "bg-info",
    accentTextClassName: "text-info",
    stepIcons: [UserRoundPlus, BookOpen, MessagesSquare, Send],
    cardDelaySeconds: 0.1,
  },
  "career-switcher": {
    personaIcon: Repeat2,
    avatarClassName: "bg-primary",
    accentTextClassName: "text-primary",
    stepIcons: [Map, Sparkles, UserCog, Search],
    cardDelaySeconds: 0.2,
  },
  "active-seeker": {
    personaIcon: Target,
    avatarClassName: "bg-warning",
    accentTextClassName: "text-warning-text",
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
    boxClassName: "border-border bg-muted",
    labelClassName: "text-primary",
  },
  tantangan: {
    icon: TriangleAlert,
    boxClassName: "border-warning/60 bg-warning/30",
    labelClassName: "text-warning-text",
  },
  hasil: {
    icon: Sparkles,
    boxClassName: "border-border bg-success/15",
    labelClassName: "text-success",
  },
};

/** Grid layout numbers — not content, so they live here rather than constants. */
export const SCENARIO_GRID = {
  columns: "grid-cols-1 md:grid-cols-3",
  stepColumns: "grid-cols-4",
} as const;
