import {
  FEATURE_GRID_ITEMS,
  HIGHLIGHT_FEATURES,
  PROOF_CARDS,
  SUPPORT_CHAT_BUBBLES,
} from "../constants/proof.constants";
import {
  CHAT_BUBBLE_STYLES,
  FEATURE_GRID_ICONS,
  HIGHLIGHT_FEATURE_ICONS,
} from "../config/proof.config";
import type {
  FeatureGridItemWithIcon,
  HighlightFeatureWithIcon,
  ProofCardContent,
  ProofCardId,
  SupportChatBubbleWithMeta,
} from "../types/proof.types";

/**
 * Single data-access seam for the Proof section: merges the literal
 * content (constants/) with presentation config (config/) into
 * render-ready shapes. Pure derivation, no component state — kept as a
 * hook for consistency with the sibling landing sections.
 */
export function useProofContent() {
  const highlightFeatures: HighlightFeatureWithIcon[] = HIGHLIGHT_FEATURES.map((feature) => ({
    ...feature,
    icon: HIGHLIGHT_FEATURE_ICONS[feature.id] ?? HIGHLIGHT_FEATURE_ICONS["ats-ready"],
  }));

  const featureGridItems: FeatureGridItemWithIcon[] = FEATURE_GRID_ITEMS.map((item) => ({
    ...item,
    icon: FEATURE_GRID_ICONS[item.id] ?? FEATURE_GRID_ICONS.cv,
  }));

  const supportChatBubbles: SupportChatBubbleWithMeta[] = SUPPORT_CHAT_BUBBLES.map((bubble) => ({
    ...bubble,
    ...CHAT_BUBBLE_STYLES[bubble.from],
  }));

  const cardsById = PROOF_CARDS.reduce<Record<ProofCardId, ProofCardContent>>((acc, card) => {
    acc[card.id] = card;
    return acc;
  }, {} as Record<ProofCardId, ProofCardContent>);

  return { highlightFeatures, featureGridItems, supportChatBubbles, cardsById };
}
