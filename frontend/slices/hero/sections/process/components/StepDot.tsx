import { cn } from "@/shared/lib/utils";

interface StepDotProps {
  id: number;
  colorClassName: string;
}

/** Circular numbered marker for one roadmap step. */
export function StepDot({ id, colorClassName }: StepDotProps) {
  return (
    <div
      className={cn(
        "relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display text-2xl text-foreground dark:text-background transition-transform duration-200 hover:scale-110",
        colorClassName
      )}
    >
      {id}
    </div>
  );
}
