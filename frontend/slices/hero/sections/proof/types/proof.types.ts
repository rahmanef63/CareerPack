import type { LucideIcon } from "lucide-react";

/**
 * Data shapes for the landing "Proof" section (replaces the old
 * StatsSection). Left column: framing copy + an honest highlight card
 * (feature callouts, NOT fabricated testimonial/stat numbers). Right
 * column: 4 factual/illustrative proof cards.
 */

/** One feature callout inside the left-column highlight card. Deliberately
 * label-only (no invented numbers) — see HONESTY RULE in the section brief. */
export interface HighlightFeature {
  id: string;
  label: string;
}

/** A highlight feature merged with its icon (config) for rendering. */
export interface HighlightFeatureWithIcon extends HighlightFeature {
  icon: LucideIcon;
}

/** One cell in the 2x2 "4-in-1" icon grid on proof card #1. */
export interface FeatureGridItem {
  id: string;
  label: string;
}

/** A feature-grid cell merged with its icon (config) for rendering. */
export interface FeatureGridItemWithIcon extends FeatureGridItem {
  icon: LucideIcon;
}

/** One bullet describing an ATS-friendliness mechanism on proof card #2.
 * Describes HOW the template stays parseable, never a guaranteed outcome. */
export interface AtsMechanismPoint {
  id: string;
  text: string;
}

/** One message bubble in the illustrative support-chat mock on proof card
 * #3. Illustrative UI only — not a claim that this exact exchange happened. */
export interface SupportChatBubble {
  id: string;
  from: "user" | "assistant";
  text: string;
}

/** A chat bubble merged with its alignment/color config for rendering. */
export interface SupportChatBubbleWithMeta extends SupportChatBubble {
  alignClassName: string;
  bubbleClassName: string;
}

/** One included-in-free-tier line item on proof card #4. */
export interface FreeTierItem {
  id: string;
  label: string;
}

/** Identifier for each of the 4 right-column proof cards, used to key
 * title/description content to the (structurally distinct) card body
 * rendered for that id. */
export type ProofCardId = "bundle" | "ats" | "support" | "free";

/** Title + description content for one right-column proof card. The body
 * markup differs per card (icon grid vs. donut vs. chat vs. checklist), so
 * only the shared chrome content lives here — see ProofCardShell. */
export interface ProofCardContent {
  id: ProofCardId;
  title: string;
  description: string;
}
