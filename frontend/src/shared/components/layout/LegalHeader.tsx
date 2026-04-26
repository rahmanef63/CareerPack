"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "../brand/Logo";
import { Button } from "@/shared/components/ui/button";

/**
 * Sticky top bar for /privacy + /terms (and any future legal pages).
 *
 * These pages live OUTSIDE the (marketing) and (dashboard) route groups
 * so they intentionally inherit only the root layout — no marketing
 * footer, no dashboard chrome. Without a header users would land on
 * a wall of copy with no obvious way back.
 *
 * Provides the brand mark + a "Kembali" link to the landing page.
 * Notch/safe-area inset preserved via --safe-top var.
 */
export function LegalHeader() {
  return (
    <header
      className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur border-b border-border"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <div className="mx-auto max-w-3xl flex items-center justify-between px-4 sm:px-6 h-14">
        <Link href="/" aria-label="CareerPack beranda" className="flex items-center">
          <Logo size={28} />
        </Link>
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden xs:inline">Kembali</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
