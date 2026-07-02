/**
 * Data shapes for the landing FAQ section (two-column layout: left intro +
 * support callout + topic list, right accordion).
 */

/** One question/answer pair rendered inside the accordion panel. */
export interface FaqItem {
  /** Stable key. A `FaqTopic` can reference this to jump/open this entry. */
  id: string;
  question: string;
  answer: string;
}

/** A single row inside the "Topik Populer" list on the left column. Clicking
 * it opens + scrolls to its matching `FaqItem` (by `faqItemId`) in the
 * accordion on the right — a real shortcut, not a decorative label. */
export interface FaqTopic {
  id: string;
  label: string;
  faqItemId: string;
}
