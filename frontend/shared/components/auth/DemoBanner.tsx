"use client";

import Link from "next/link";
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
          <p className="text-xs text-muted-foreground">
            Data ini pribadi untuk sesi ini saja. Logout = terhapus. Daftar
            untuk menyimpan progres kamu.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button asChild size="sm" className="bg-brand hover:bg-brand">
          <Link href={ROUTES.auth.login} onClick={() => logout()}>
            <UserPlus className="w-3.5 h-3.5 mr-1.5" aria-hidden />
            Daftar
          </Link>
        </Button>
      </div>
    </div>
  );
}
