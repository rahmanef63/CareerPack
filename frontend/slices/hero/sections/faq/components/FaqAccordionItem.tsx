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
    <AccordionItem id={entry.value} value={entry.value} className="border-border">
      <AccordionTrigger className="-mx-3 rounded-lg px-3 text-left text-foreground transition-colors duration-150 hover:bg-background/50 hover:no-underline [&_svg]:text-muted-foreground">
        <span className="flex items-center gap-4">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
            aria-hidden="true"
          >
            {entry.chipLabel}
          </span>
          <span className="font-medium">{entry.item.question}</span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pl-11 text-muted-foreground">
        {entry.item.answer}
      </AccordionContent>
    </AccordionItem>
  );
}
