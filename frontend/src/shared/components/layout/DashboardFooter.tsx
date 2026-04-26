import Link from "next/link";
import { cn } from "@/shared/lib/utils";
import { APP_NAME, APP_VERSION } from "@/shared/lib/appMeta";

/**
 * Subtle dashboard footer — desktop only (≥lg). Renders below the
 * main content inside SidebarInset to close the visual frame.
 *
 * Mobile skips this (BottomNav already owns the bottom region).
 * One-line: copyright + legal + version. No external CTAs, no
 * contact info — dashboard is app surface, not marketing.
 *
 * App name + version read from shared/lib/appMeta.ts (SSoT).
 */
export interface DashboardFooterProps {
  className?: string;
}

export function DashboardFooter({ className }: DashboardFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "hidden lg:block border-t border-border bg-background/60 backdrop-blur",
        "px-6 py-3",
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>© {year} {APP_NAME}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">v{APP_VERSION}</span>
        </div>
        <nav
          aria-label="Footer"
          className="flex items-center gap-4"
        >
          <Link
            href="/dashboard/help"
            className="hover:text-foreground transition-colors"
          >
            Pusat Bantuan
          </Link>
          <Link
            href="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privasi
          </Link>
          <Link
            href="/terms"
            className="hover:text-foreground transition-colors"
          >
            Ketentuan
          </Link>
        </nav>
      </div>
    </footer>
  );
}
