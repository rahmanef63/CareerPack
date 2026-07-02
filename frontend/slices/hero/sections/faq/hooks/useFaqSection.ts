import { FAQ_ITEMS } from "../constants/faqItems";
import { FAQ_TOPICS } from "../constants/topics";
import { FAQ_REVEAL_STEP_SECONDS, FAQ_SUPPORT_HREF } from "../config/faqConfig";
import type { FaqItem, FaqTopic } from "../types/faq.types";

export interface FaqEntry {
  item: FaqItem;
  /** Accordion value, unique per item. */
  value: string;
  /** 1-based local list index — visual numbering for this accordion only. */
  chipLabel: string;
}

export interface UseFaqSectionResult {
  entries: FaqEntry[];
  topics: FaqTopic[];
  supportHref: string;
  /** Inline style for staggered scroll-reveal, `n` = 0-based element order. */
  revealDelay: (n: number) => { animationDelay: string };
}

/**
 * Merges the FAQ content + topic constants with presentation config into a
 * render-ready shape: numbered accordion entries, topic rows, support link,
 * and a small stagger-delay helper for `.animate-on-scroll` elements.
 */
export function useFaqSection(): UseFaqSectionResult {
  const entries: FaqEntry[] = FAQ_ITEMS.map((item, index) => ({
    item,
    value: `faq-${index}`,
    chipLabel: String(index + 1),
  }));

  const revealDelay = (n: number) => ({
    animationDelay: `${(n * FAQ_REVEAL_STEP_SECONDS).toFixed(1)}s`,
  });

  return { entries, topics: FAQ_TOPICS, supportHref: FAQ_SUPPORT_HREF, revealDelay };
}
