import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

interface ProofCardShellProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** Shared card chrome for the 4 right-column proof cards — the repeated
 * shell (surface, border, radius, padding, title, description) is
 * centralized here so each card only implements its own distinct body. */
export function ProofCardShell({ title, description, children, className, style }: ProofCardShellProps) {
  return (
    <div
      className={cn(
        "animate-on-scroll flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 opacity-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
      style={style}
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-lg font-semibold leading-snug text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
