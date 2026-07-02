import { Briefcase, CircleDot, Flag, MessageCircle, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { ApplicationStatus } from "../types/hero.types";

/** Eyebrow row icon — small ring-with-center-dot. */
export const EYEBROW_ICON: LucideIcon = CircleDot;

/** Icon + accent color per mini step-card, keyed by MINI_STEPS[].id. */
export const MINI_STEP_VISUALS: Record<string, { icon: LucideIcon; bgClassName: string }> = {
  profile: { icon: Sparkles, bgClassName: "bg-landing-blue" },
  interview: { icon: MessageCircle, bgClassName: "bg-landing-green" },
  applications: { icon: Briefcase, bgClassName: "bg-landing-terra" },
  // 4th distinct shade not in the token list — one-off arbitrary value per design brief.
  offer: { icon: Flag, bgClassName: "bg-[#27573b]" },
};

/** Fake text-line bar widths per resume mini-section, keyed by RESUME_SECTIONS[].id. */
export const RESUME_SECTION_LINE_WIDTHS: Record<string, string[]> = {
  about: ["w-full", "w-4/5"],
  experience: ["w-full", "w-11/12", "w-3/5"],
  skills: ["w-3/4", "w-1/2"],
};

/** Badge color per application status category (green/amber/gray). */
export const APPLICATION_STATUS_BADGE: Record<ApplicationStatus, string> = {
  Interview: "border-landing-green/30 bg-landing-mint text-landing-green",
  Ditinjau: "border-landing-gold/40 bg-landing-gold/15 text-landing-gold",
  Tersimpan: "border-landing-line bg-landing-line/40 text-landing-muted",
};

/** Staggered fade-in delay step (seconds) applied per left-column block, in order. */
export const REVEAL_DELAY_STEP = 0.1;

/**
 * Desk collage — absolute position/rotation/z-index per card slot. Pixel values are
 * hand-tuned for a `relative min-h-[600px]` container; simplified vs. a literal
 * reference layout but preserves the "scattered desk" read at lg/xl widths.
 */
export const DESK_COLLAGE_LAYOUT = {
  resumeCard: "absolute left-0 top-0 z-20 w-[340px] -rotate-1",
  stampBadge: "absolute right-2 top-0 z-30 h-24 w-24 rotate-[-10deg]",
  stickyNote1: "absolute right-20 top-28 z-20 w-44 rotate-[6deg]",
  checklistCard: "absolute right-0 top-56 z-10 w-[300px] rotate-[4deg]",
  polaroid: "absolute left-6 top-[330px] z-10 w-40 -rotate-[8deg]",
  trackerCard: "absolute left-0 bottom-0 z-20 w-[350px] rotate-1",
  stickyNote2: "absolute right-6 bottom-0 z-20 w-52 -rotate-[5deg]",
} as const;
