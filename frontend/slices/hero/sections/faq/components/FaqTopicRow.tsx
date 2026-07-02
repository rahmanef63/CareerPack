import { ChevronRight } from "lucide-react";

import type { FaqTopic } from "../types/faq.types";

interface FaqTopicRowProps {
  topic: FaqTopic;
}

/** One row inside "Topik Populer" — plain visual/navigational, non-interactive. */
export function FaqTopicRow({ topic }: FaqTopicRowProps) {
  return (
    <li className="flex items-center justify-between border-b border-landing-line py-3 text-sm text-landing-ink last:border-0">
      <span>{topic.label}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-landing-muted" aria-hidden="true" />
    </li>
  );
}
