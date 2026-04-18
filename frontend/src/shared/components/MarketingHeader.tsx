"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Logo } from "./Logo";

/**
 * Top bar untuk route `(marketing)` — ringan, tidak ada auth guard.
 * Menampilkan Logo + toggle tema + CTA Masuk / Mulai Gratis.
 */
export function MarketingHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14">
        <Link href="/" aria-label="CareerPack beranda" className="flex items-center">
          <Logo size={28} />
        </Link>
        <nav className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Gunakan mode terang" : "Gunakan mode gelap"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Masuk</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-gradient-to-br from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white"
          >
            <Link href="/login">Mulai Gratis</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
