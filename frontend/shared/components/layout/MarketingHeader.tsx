"use client";

import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { Logo } from "../brand/Logo";
import { ThemePresetSwitcher } from "@/shared/components/theme/ThemePresetSwitcher";

/**
 * Top bar for `(marketing)` route — full lockup at every breakpoint
 * because the unified theme controller dropped the separate sun/moon
 * button, freeing enough horizontal space for the wordmark to stay
 * visible on phones too.
 *
 * `--safe-top` provides notch clearance under standalone PWA + a
 * baseline 12 px breathing room in regular browser tabs.
 */
export function MarketingHeader() {
  return (
    <header
      className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur border-b border-border"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-3 sm:px-6 lg:px-8 h-14 gap-2">
        <Link
          href="/"
          aria-label="CareerPack beranda"
          className="flex items-center min-w-0"
        >
          <Logo size={28} />
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemePresetSwitcher />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Masuk</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-gradient-to-br from-brand-from to-brand-to hover:from-brand-from/90 hover:to-brand-to/90 text-brand-foreground"
          >
            <Link href="/login">Mulai Gratis</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
