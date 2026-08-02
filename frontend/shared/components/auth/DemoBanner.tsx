"use client";

import { Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/shared/hooks/useAuth";
import { ROUTES } from "@/shared/lib/routes";

/**
 * Small banner shown above dashboard content whenever the user is in
 * an anonymous demo session. Makes the mode explicit ("this is demo
 * data, it will disappear") and invites a conversion to a real
 * account via the logout → register path.
 *
 * Returns null for real (email-based) sessions — zero footprint on
 * regular users.
 */
export function DemoBanner() {
  const { state, logout } = useAuth();

  if (!state.isDemo) return null;

  return (
    <div
      role="status"
      className="relative overflow-hidden rounded-xl border border-brand/30 bg-brand-muted/40 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground">
          <Sparkles className="w-4 h-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Mode Demo Aktif
          </p>
          {/* Third rewrite, and the first one that matches the code. The second
              said "semua progres kamu ikut terbawa" — reasoning from
              convex/admin/cleanup.ts, which keeps the anonymous *account* row
              once it gains an email. But feature data never reaches that row:
              useDemoOverlay.ts persists applications, CV, portfolio, contacts,
              agenda, checklist and profile to localStorage and deliberately
              does NOT write to Convex, and there is no overlay→Convex migration
              anywhere in the tree (grep: none). Signing up therefore starts
              clean. Promising otherwise is the one failure a visitor cannot
              forgive, so the banner now says the true thing up front. */}
          <p className="text-xs text-muted-foreground">
            Coba semua fitur tanpa daftar. Yang Anda buat di sini tersimpan di
            browser ini saja dan tidak ikut terbawa saat mendaftar — daftar
            gratis kalau sudah siap menyimpan pekerjaan Anda sungguhan.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* A real button, not a <Link> with an onClick. The link navigated
            while the demo session was still live, the guest guard on /login
            bounced it straight to /dashboard, and the awaited signOut then
            redirected to the landing page — so the one person on the whole site
            who had already decided to sign up never saw a signup form. */}
        <Button
          size="sm"
          className="bg-brand hover:bg-brand"
          onClick={() => logout(ROUTES.auth.login)}
        >
          <UserPlus className="w-3.5 h-3.5 mr-1.5" aria-hidden />
          Daftar
        </Button>
      </div>
    </div>
  );
}
