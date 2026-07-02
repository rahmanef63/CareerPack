import {
  Calendar,
  FileCheck,
  FileUser,
  Gift,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

/**
 * Presentation/behavior config for the Proof section — icon-per-item,
 * color-per-category, and layout numbers. No Indonesian copy lives here;
 * see constants/proof.constants.ts for content.
 */

/** Icon per highlight-card feature callout, keyed by HighlightFeature.id. */
export const HIGHLIGHT_FEATURE_ICONS: Record<string, LucideIcon> = {
  "ats-ready": FileCheck,
  "interview-ai": MessageCircle,
  "track-all": Calendar,
};

/** Icon per "bundle" card grid cell, keyed by FeatureGridItem.id. */
export const FEATURE_GRID_ICONS: Record<string, LucideIcon> = {
  cv: FileUser,
  calendar: Calendar,
  interview: MessageCircle,
  documents: FileCheck,
};

/** Icon for the "free" card header. */
export const FREE_TIER_ICON: LucideIcon = Gift;

/**
 * Donut chart config for the "ats" card. Built with a plain div +
 * conic-gradient inline style (no chart lib) per the section brief.
 * Inline `style` can't reference a Tailwind class, so these reference the
 * same CSS custom properties the app's `primary`/`border` Tailwind tokens
 * resolve to (see shared/styles/index.css) — stays in sync with light/dark
 * mode automatically instead of freezing the light-mode color.
 */
export const ATS_DONUT_CONFIG = {
  filledColor: "oklch(var(--primary))",
  trackColor: "oklch(var(--border))",
  sizeClassName: "h-28 w-28",
  /** Inset (percent, all sides) of the inner cutout that turns the filled
   * circle into a ring/donut. */
  holeInsetPercent: 14,
};

/** Alignment + bubble styling per chat-bubble sender, keyed by
 * SupportChatBubble.from. */
export const CHAT_BUBBLE_STYLES: Record<
  "user" | "assistant",
  { alignClassName: string; bubbleClassName: string }
> = {
  user: {
    // text-white is intentional here, same as the rest of this section's
    // colored chips/badges/buttons: white-on-accent needs to stay constant
    // regardless of light/dark mode, exactly like the app's own
    // --primary-foreground stays pure white in both :root and .dark (see
    // shared/styles/index.css) — it's bg-primary that carries the
    // theme-reactive identity, not this text.
    alignClassName: "justify-end",
    bubbleClassName: "bg-primary text-white",
  },
  assistant: {
    alignClassName: "justify-start",
    bubbleClassName: "bg-background text-foreground border border-border",
  },
};

/** Grid + stagger-delay numbers for the section layout. */
export const PROOF_LAYOUT = {
  gridColsClassName: "lg:grid-cols-[0.85fr_1fr_1fr]",
  cardsGridColsClassName: "sm:grid-cols-2",
  revealDelayStepSeconds: 0.1,
};
