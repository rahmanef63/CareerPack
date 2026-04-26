import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { ParangPattern } from "@/shared/components/decor/ParangPattern";

/**
 * Responsive page header.
 *
 * Three visual variants — all share the same props API so existing
 * callers (10+ slices) stay working without changes. Default variant
 * = `compact` preserves pre-existing behavior pixel-for-pixel.
 *
 * - `compact`  (default) → inline title + description + actions row.
 *                Used for CRUD / list pages.
 * - `greeting` → wraps header in a subtle brand-gradient banner with
 *                oversized title, soft decorative glow. For dashboard
 *                homes where we want a welcoming "hello" feel.
 * - `split`    → greeting variant + companion slot on the right. The
 *                companion card sits beside the greeting at ≥md, drops
 *                below on smaller viewports. Ideal for PWA install
 *                prompts, "what's new" callouts, etc.
 *
 * All three respect `prefers-reduced-motion` (no pulse / transform).
 * Gradient uses semantic tokens so all 36 theme presets adapt.
 */
export type PageHeaderVariant = "compact" | "greeting" | "split";

export interface ResponsivePageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Optional back link (shown above title on mobile, inline left on desktop). */
  backHref?: string;
  backLabel?: string;
  /** Right-side action buttons (desktop) / below description (mobile). */
  actions?: ReactNode;
  /** Optional breadcrumb node rendered above the title (e.g., <Breadcrumb />). */
  breadcrumb?: ReactNode;
  /** Visual variant. Default = "compact" — unchanged from prior behavior. */
  variant?: PageHeaderVariant;
  /** Companion slot shown to the right of the greeting in `split` variant only. */
  companion?: ReactNode;
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
  breadcrumb,
  variant = "compact",
  companion,
  className,
  titleClassName,
}: ResponsivePageHeaderProps) {
  if (variant === "compact") {
    return (
      <header className={cn("mb-4 space-y-3 lg:mb-6", className)}>
        {breadcrumb && <div className="text-xs">{breadcrumb}</div>}
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

  // greeting + split share the same banner chrome.
  const Greeting = (
    <header
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border",
        "bg-gradient-to-br from-brand-muted/40 via-background to-brand-muted/20",
        "px-5 py-6 md:px-8 md:py-8",
      )}
    >
      {/* Decorative — parang-inspired SVG texture at 8% + two glow
          orbs. Reduced-motion friendly (no animation). Theme tokens
          so every preset / dark mode adapts automatically. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
      >
        <ParangPattern />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-brand/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-brand/10 blur-3xl"
      />

      <div className="relative space-y-2">
        {breadcrumb && <div className="text-xs">{breadcrumb}</div>}
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </Link>
        )}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
          <div className="min-w-0">
            <h1
              className={cn(
                // Display font (Fraunces) on greeting/split variants —
                // editorial warmth, opsz optical sizing via variable
                // axes, tighter tracking at larger sizes.
                "font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.05]",
                titleClassName,
              )}
            >
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );

  if (variant === "greeting") {
    return <div className={cn("mb-4 lg:mb-6", className)}>{Greeting}</div>;
  }

  // split — greeting + companion card, stacked on mobile, side-by-side on md+.
  return (
    <div
      className={cn(
        "mb-4 grid gap-4 lg:mb-6 md:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]",
        className,
      )}
    >
      {Greeting}
      {companion && (
        <aside
          aria-label="Informasi tambahan"
          className="rounded-2xl border border-border bg-card p-4 md:p-5"
        >
          {companion}
        </aside>
      )}
    </div>
  );
}
