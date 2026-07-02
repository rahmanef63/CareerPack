import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";

import type { FaqEntry } from "../hooks/useFaqSection";

interface FaqAccordionItemProps {
  entry: FaqEntry;
}

/** One accordion row, prefixed with a small circular numbered chip (local list index). */
export function FaqAccordionItem({ entry }: FaqAccordionItemProps) {
  return (
    <AccordionItem value={entry.value} className="border-landing-line">
      <AccordionTrigger className="text-left text-landing-ink hover:no-underline [&_svg]:text-landing-muted">
        <span className="flex items-center gap-4">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-landing-blue/10 text-xs font-semibold text-landing-blue"
            aria-hidden="true"
          >
            {entry.chipLabel}
          </span>
          <span className="font-medium">{entry.item.question}</span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pl-11 text-landing-muted">
        {entry.item.answer}
      </AccordionContent>
    </AccordionItem>
  );
}
