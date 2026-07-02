import { ChevronRight } from "lucide-react";

import type { FaqTopic } from "../types/faq.types";

interface FaqTopicRowProps {
  topic: FaqTopic;
}

/** One row inside "Topik Populer" — visual/navigational, gets a subtle hover affordance. */
export function FaqTopicRow({ topic }: FaqTopicRowProps) {
  return (
    <li className="group -mx-2 flex items-center justify-between border-b border-border px-2 py-3 text-sm text-foreground transition-colors duration-150 last:border-0 hover:bg-background hover:text-primary">
      <span>{topic.label}</span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-1 group-hover:text-primary"
        aria-hidden="true"
      />
    </li>
  );
}
