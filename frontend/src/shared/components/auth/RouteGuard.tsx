"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/hooks/useAuth";
import { LoadingScreen } from "@/shared/components/feedback/LoadingScreen";
import type { AuthState } from "@/shared/types/auth";
import type { UserRole } from "@/shared/types/common";

export type GuardMode = "auth" | "guest" | "role";

interface RouteGuardProps {
  mode: GuardMode;
  /** Required role when `mode="role"`. Ignored otherwise. */
  requiredRole?: UserRole;
  /** Override default redirect target on guard failure. */
  redirectTo?: string;
  children: ReactNode;
}

type GuardResult = { pass: true } | { pass: false; target: string } | null;

function evaluate(
  state: AuthState,
  mode: GuardMode,
  requiredRole: UserRole | undefined,
  redirectTo: string | undefined,
): GuardResult {
  if (state.isLoading) return null;

  if (mode === "auth") {
    return state.isAuthenticated
      ? { pass: true }
      : { pass: false, target: redirectTo ?? "/login" };
  }

  if (mode === "guest") {
    return !state.isAuthenticated
      ? { pass: true }
      : { pass: false, target: redirectTo ?? "/dashboard" };
  }

  // role
  if (!state.isAuthenticated) {
    return { pass: false, target: "/login" };
  }
  if (state.user?.role !== requiredRole) {
    return { pass: false, target: redirectTo ?? "/" };
  }
  return { pass: true };
}

/**
 * DRY guard untuk halaman berbasis status auth.
 *
 * - `mode="auth"` — harus login. Redirect `/login` (atau `redirectTo`).
 * - `mode="guest"` — harus belum login. Redirect `/dashboard`.
 * - `mode="role"` — harus login + `requiredRole`. Non-auth → `/login`,
 *   auth tapi role salah → `/` (atau `redirectTo`).
 *
 * Render `<LoadingScreen />` selama `state.isLoading`, sebelum
 * redirect effect berjalan, dan selama komputasi `replace()` in-flight.
 */
export function RouteGuard({
  mode,
  requiredRole,
  redirectTo,
  children,
}: RouteGuardProps) {
  const router = useRouter();
  const { state } = useAuth();
  const result = evaluate(state, mode, requiredRole, redirectTo);

  useEffect(() => {
    if (result && !result.pass) {
      router.replace(result.target);
    }
  }, [result, router]);

  if (!result || !result.pass) return <LoadingScreen />;
  return <>{children}</>;
}
