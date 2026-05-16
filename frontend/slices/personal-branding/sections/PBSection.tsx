"use client";

import { ChevronDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export interface PBSectionProps {
  /** Stable key — used by the parent's accordion state to track open/closed. */
  sectionId: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  /** Color tint for the icon background — matches CV editor look. */
  tone?: "brand" | "emerald" | "amber" | "rose" | "indigo";
  /** Currently-open accordion section id (controlled by parent). */
  activeId: string | null;
  /** Toggle handler — receives the section's id. */
  onToggle: (id: string) => void;
  /** Optional right-side content (e.g. badge, action button). */
  right?: React.ReactNode;
  children: React.ReactNode;
}

const TONE_BG: Record<NonNullable<PBSectionProps["tone"]>, string> = {
  brand: "bg-brand-muted text-brand",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
};

/**
 * PB-side accordion item — mirrors the CV editor's `Section` pattern
 * (single-open accordion, Card with clickable header, chevron toggle,
 * content reveals when open). Keeps the visual rhythm consistent
 * across CV editor and PB editor for users who switch between them.
 *
 * Uses Card + clickable header instead of native <details> so the
 * "tone" + interactive spacing matches the rest of the dashboard.
 */
export function PBSection({
  sectionId,
  title,
  description,
  icon,
  tone = "brand",
  activeId,
  onToggle,
  right,
  children,
}: PBSectionProps) {
  const isOpen = activeId === sectionId;

  function handleHeaderClick(e: React.MouseEvent<HTMLDivElement>) {
    // Don't toggle when the click started on an interactive element
    // inside the header (e.g. the right-side action button).
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, [role=switch]")) return;
    onToggle(sectionId);
  }

  return (
    <Card className="overflow-hidden border-border">
      <CardHeader
        className="cursor-pointer bg-muted/40 px-4 py-3 transition-colors hover:bg-muted/60 sm:px-6"
        onClick={handleHeaderClick}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {icon && (
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE_BG[tone]}`}
              >
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <CardTitle className="truncate text-base sm:text-lg">
                {title}
              </CardTitle>
              {description && (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {right}
            <button
              type="button"
              onClick={() => onToggle(sectionId)}
              aria-expanded={isOpen}
              aria-label={isOpen ? `Tutup ${title}` : `Buka ${title}`}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>
      </CardHeader>
      {isOpen && <CardContent className="px-4 pt-4 sm:px-6">{children}</CardContent>}
    </Card>
  );
}
