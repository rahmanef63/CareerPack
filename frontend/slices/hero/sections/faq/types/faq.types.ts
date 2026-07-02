/**
 * Data shapes for the landing FAQ section (two-column layout: left intro +
 * support callout + topic list, right accordion).
 */

/** One question/answer pair rendered inside the accordion panel. */
export interface FaqItem {
  question: string;
  answer: string;
}

/** A single row inside the "Topik Populer" list on the left column. */
export interface FaqTopic {
  id: string;
  label: string;
}
