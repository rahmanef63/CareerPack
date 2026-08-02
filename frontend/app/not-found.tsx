import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { NotFoundArt } from "@/shared/components/illustrations/marketing";

/**
 * Root-level 404 page. Next's default whitescreen is too cold for a
 * consumer SaaS — this one matches the marketing shell (brand-tinted
 * background, the 404 illustration, Indonesian copy) and offers clear
 * recovery CTAs back to the dashboard or landing.
 *
 * Rendered whenever `notFound()` is called anywhere (e.g. /[slug]
 * for a disabled profile) or an unmatched route lands here.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-muted/40 via-background to-background flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl border border-border bg-card">
          <NotFoundArt />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground tabular-nums">
            404
          </p>
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
