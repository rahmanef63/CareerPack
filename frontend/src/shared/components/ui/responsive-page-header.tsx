import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

/**
 * Responsive page header.
 *
 * Desktop (≥lg): title + description left, actions right (single row).
 * Mobile (<lg): stacked — back link, title, description, actions full-width.
 *
 * Pure CSS via Tailwind `lg:` — no JS detection needed, no hydration flash.
 *
 * Use once per slice page to standardize top-of-view chrome.
 */
export interface ResponsivePageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Optional back link (shown above title on mobile, inline left on desktop). */
  backHref?: string;
  backLabel?: string;
  /** Right-side action buttons (desktop) / below description (mobile). */
  actions?: ReactNode;
  /** Render at top even when within another flex/grid context. */
  className?: string;
  /** Extra class on the title <h1>. */
  titleClassName?: string;
}

export function ResponsivePageHeader({
  title,
  description,
  backHref,
  backLabel = "Kembali",
  actions,
  className,
  titleClassName,
}: ResponsivePageHeaderProps) {
  return (
    <header className={cn("mb-4 space-y-3 lg:mb-6", className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0">
          <h1
            className={cn(
              "text-xl font-semibold tracking-tight text-foreground lg:text-2xl",
              titleClassName,
            )}
          >
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
