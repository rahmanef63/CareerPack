import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

/**
 * PageContainer — single source of truth for slice-level page framing.
 *
 * Every dashboard slice wraps its content in this. Centralizes the
 * max-width + vertical breathing room so adjusting the app's visual
 * rhythm is a one-file change. Horizontal gutter is provided by the
 * outer shell (DesktopContainer has `p-4 md:p-6`; MobileContainer's
 * `<main>` adds `px-4`).
 *
 * Sizes (pick by content density):
 *   sm (3xl)  — narrow forms, single-column settings
 *   md (4xl)  — focused pages (auth-ish inside dashboard, help)
 *   lg (6xl)  — default; most dashboard pages
 *   xl (7xl)  — dense dashboards with rails / multi-col content
 *
 * Additional layout (flex, grid, space-y) passes via `className` — it
 * composes AFTER the default classes so overrides still win.
 */
export type PageContainerSize = "sm" | "md" | "lg" | "xl";

export interface PageContainerProps {
  size?: PageContainerSize;
  className?: string;
  children: ReactNode;
}

const MAX_W: Record<PageContainerSize, string> = {
  sm: "max-w-3xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
};

export function PageContainer({
  size = "lg",
  className,
  children,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full py-4 sm:py-6",
        MAX_W[size],
        className,
      )}
    >
      {children}
    </div>
  );
}
