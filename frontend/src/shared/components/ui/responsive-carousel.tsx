"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";

/**
 * App Store-style horizontal carousel.
 *
 * - Scroll-snap to item bounds on both desktop + mobile.
 * - Mobile: swipe-scrollable, scrollbar hidden.
 * - Desktop: arrow buttons appear in header row (prev/next), overflow-x-auto.
 * - Each card is a "peek" of the next one at the right edge on mobile so
 *   users know there's more to the right.
 *
 * Keeps semantics as a plain horizontal list — not a fancy embla carousel.
 * Sufficient for most dashboard "top picks" rows without dep.
 */

export interface ResponsiveCarouselProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Right-side element in the header (link, button). */
  headerAction?: React.ReactNode;
  /** Items rendered as carousel cells. Should be an array of React nodes or a single fragment. */
  children: React.ReactNode;
  /** Extra class on the scroll container. */
  className?: string;
  /** Extra class on each cell wrapper. */
  cellClassName?: string;
  /** Tailwind width class for each cell. Default `w-64`. Use `basis-*` utilities via cellClassName if needed. */
  cellWidth?: string;
  /** Hide desktop arrow controls. */
  hideControls?: boolean;
}

export function ResponsiveCarousel({
  title,
  description,
  headerAction,
  children,
  className,
  cellClassName,
  cellWidth = "w-64",
  hideControls,
}: ResponsiveCarouselProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);

  const updateEdges = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.max(el.clientWidth * 0.8, 240);
    el.scrollBy({ left: step * dir, behavior: "smooth" });
  };

  const items = React.Children.toArray(children);

  return (
    <section className={cn("space-y-3", className)}>
      {(title || description || headerAction || !hideControls) && (
        <header className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold text-foreground lg:text-lg">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-muted-foreground lg:text-sm">
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerAction}
            {!hideControls && (
              <div className="hidden lg:flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Sebelumnya"
                  onClick={() => scrollBy(-1)}
                  disabled={atStart}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Berikutnya"
                  onClick={() => scrollBy(1)}
                  disabled={atEnd}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </header>
      )}

      <div
        ref={scrollerRef}
        role="list"
        className={cn(
          "flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2",
          "[scrollbar-width:none] [-ms-overflow-style:none]",
          "[&::-webkit-scrollbar]:hidden",
          // breathing room so first item isn't glued to the edge
          "scroll-px-4 -mx-4 px-4 lg:mx-0 lg:px-0 lg:scroll-px-0",
        )}
      >
        {items.map((child, i) => (
          <div
            key={i}
            role="listitem"
            className={cn("shrink-0 snap-start", cellWidth, cellClassName)}
          >
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}
