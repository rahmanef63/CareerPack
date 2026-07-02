import { cn } from "@/shared/lib/utils";

interface StickyNoteProps {
  text: string;
  className: string;
  bgClassName: string;
  textClassName?: string;
}

/** Small rotated sticky-note used twice in the desk collage, styled per-instance via props. */
export function StickyNote({ text, className, bgClassName, textClassName }: StickyNoteProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-landing-line p-4 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:rotate-0 hover:shadow-2xl hover:z-40",
        bgClassName,
        className
      )}
    >
      <p className={cn("font-display text-lg italic leading-snug", textClassName ?? "text-landing-ink")}>
        {text}
      </p>
    </div>
  );
}
