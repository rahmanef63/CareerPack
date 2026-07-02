import { ChevronRight } from "lucide-react";

import type { FaqTopic } from "../types/faq.types";

interface FaqTopicRowProps {
  topic: FaqTopic;
}

/** One row inside "Topik Populer" — visual/navigational, gets a subtle hover affordance. */
export function FaqTopicRow({ topic }: FaqTopicRowProps) {
  return (
    <li className="group -mx-2 flex items-center justify-between border-b border-landing-line px-2 py-3 text-sm text-landing-ink transition-colors duration-150 last:border-0 hover:bg-landing-paper hover:text-landing-blue">
      <span>{topic.label}</span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-landing-muted transition-transform duration-150 group-hover:translate-x-1 group-hover:text-landing-blue"
        aria-hidden="true"
      />
    </li>
  );
}
