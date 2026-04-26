import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { BrandMark } from "@/shared/components/brand/Logo";

/**
 * Root-level 404 page. Next's default whitescreen is too cold for a
 * consumer SaaS — this one matches the marketing shell (brand-tinted
 * background, BrandMark, Indonesian copy) and offers clear recovery
 * CTAs back to the dashboard or landing.
 *
 * Rendered whenever `notFound()` is called anywhere (e.g. /[slug]
 * for a disabled profile) or an unmatched route lands here.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-muted/40 via-background to-background flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground shadow-cta">
          <BrandMark
            size={28}
            stroke="oklch(var(--brand-foreground))"
            strokeWidth={2.4}
          />
        </span>

        <div className="space-y-2">
          <p className="text-6xl font-bold text-foreground tabular-nums">404</p>
          <h1 className="text-xl font-semibold text-foreground">
            Halaman tidak ditemukan
          </h1>
          <p className="text-sm text-muted-foreground">
            URL yang kamu buka mungkin salah ketik, atau konten sudah
            dipindahkan. Coba balik ke halaman utama.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button asChild>
            <Link href="/dashboard">
              <Home className="w-4 h-4 mr-1.5" />
              Ke Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Search className="w-4 h-4 mr-1.5" />
              Landing
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
