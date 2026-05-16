"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { activeNavForPath } from "./navConfig";

/**
 * Breadcrumb — auto-derived from the current pathname via `activeNavForPath`.
 * Renders as a compact row above the page title:
 *
 *   ⌂ Dashboard › CV Generator
 *
 * No manual item list needed. On `/dashboard` (home) it collapses to
 * just "⌂ Dashboard" — no trailing separator. Links are underlined on
 * hover; current page is text-foreground (not a link).
 *
 * Pure presentation. Server-safe via "use client" for usePathname.
 */
export interface BreadcrumbProps {
  className?: string;
  /** When true, add extra padding to stand alone. Default embeds inline. */
  standalone?: boolean;
}

export function Breadcrumb({ className, standalone = false }: BreadcrumbProps) {
  const pathname = usePathname();
  const active = activeNavForPath(pathname);

  // Derived trail: always includes Home ⌂. When on a sub-view, append it.
  const onHome = pathname === "/dashboard" || pathname === "/";
  const showCurrent = !onHome && active && active.href !== "/dashboard";

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        standalone && "mb-3",
        className,
      )}
    >
      <Link
        href="/dashboard"
        className={cn(
          "inline-flex items-center gap-1 transition-colors",
          onHome
            ? "text-foreground font-medium"
            : "hover:text-foreground",
        )}
        aria-current={onHome ? "page" : undefined}
      >
        <Home className="h-3 w-3" aria-hidden />
        <span>Dashboard</span>
      </Link>
      {showCurrent && (
        <>
          <ChevronRight
            className="h-3 w-3 flex-shrink-0 text-muted-foreground/60"
            aria-hidden
          />
          <span
            className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none"
            aria-current="page"
          >
            {active.label}
          </span>
        </>
      )}
    </nav>
  );
}
