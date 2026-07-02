import { ChevronRight } from "lucide-react";

import type { FaqTopic } from "../types/faq.types";

interface FaqTopicRowProps {
  topic: FaqTopic;
  onClick: () => void;
}

/** One row inside "Topik Populer" — a real interactive control that opens +
 * scrolls to its matching FAQ answer in the accordion on the right. */
export function FaqTopicRow({ topic, onClick }: FaqTopicRowProps) {
  return (
    <li className="last:[&>button]:border-0">
      <button
        type="button"
        onClick={onClick}
        className="group -mx-2 flex w-full items-center justify-between border-b border-border px-2 py-3 text-left text-sm text-foreground transition-colors duration-150 hover:bg-background hover:text-primary"
      >
        <span>{topic.label}</span>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-1 group-hover:text-primary"
          aria-hidden="true"
        />
      </button>
    </li>
  );
}
