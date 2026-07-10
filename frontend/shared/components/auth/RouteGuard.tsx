"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/hooks/useAuth";
import { LoadingScreen } from "@/shared/components/feedback/LoadingScreen";
import type { AuthState } from "@/shared/types/auth";
import type { UserRole } from "@/shared/types/common";
import { ROUTES } from "@/shared/lib/routes";

/** Grace window before bouncing an "auth"/"role" route to /login on a
 *  Convex auth drop — a flaky connection (VPN, bad Wi-Fi) makes Convex's
 *  own AuthenticationManager give up reauth and briefly report
 *  isAuthenticated=false before it reconnects with the stored token.
 *  Without this, RouteGuard bounced the user to /login and back on every
 *  WebSocket hiccup, which read as the page "refreshing itself". */
const REAUTH_GRACE_MS = 2500;

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
      : { pass: false, target: redirectTo ?? ROUTES.auth.login };
  }

  if (mode === "guest") {
    return !state.isAuthenticated
      ? { pass: true }
      : { pass: false, target: redirectTo ?? ROUTES.dashboard.home };
  }

  // role
  if (!state.isAuthenticated) {
    return { pass: false, target: ROUTES.auth.login };
  }
  if (state.user?.role !== requiredRole) {
    return { pass: false, target: redirectTo ?? ROUTES.marketing.landing };
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

  // Depend on the primitive evaluation inputs (not the fresh `result`
  // object, which changes identity every render) and recompute the
  // redirect target inside the effect so it fires only when inputs move.
  const role = state.user?.role;
  const stateRef = useRef(state);
  stateRef.current = state;

  // Once an auth/role route has actually rendered its content, remember it.
  // A transient Convex WS auth drop flips isAuthenticated false for a beat;
  // without this we'd swap the whole page for a spinner (perceived as a
  // self-refresh) even though the grace timer will self-heal the reconnect.
  const hasPassedRef = useRef(false);
  if (result?.pass && (mode === "auth" || mode === "role")) {
    hasPassedRef.current = true;
  }

  useEffect(() => {
    const r = evaluate(state, mode, requiredRole, redirectTo);
    if (!r || r.pass) return;

    // "guest" mode (e.g. /login) has nothing to preserve — bounce right away.
    if (mode === "guest") {
      router.replace(r.target);
      return;
    }

    // "auth"/"role": don't bounce on the first sign of trouble — wait out
    // REAUTH_GRACE_MS and re-check, so a transient reconnect can self-heal.
    const timer = setTimeout(() => {
      const recheck = evaluate(stateRef.current, mode, requiredRole, redirectTo);
      if (recheck && !recheck.pass) router.replace(recheck.target);
    }, REAUTH_GRACE_MS);
    return () => clearTimeout(timer);
    // `state` is excluded — we depend on its primitive fields below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.isLoading,
    state.isAuthenticated,
    role,
    mode,
    requiredRole,
    redirectTo,
    router,
  ]);

  if (result?.pass) return <>{children}</>;
  // Keep rendering already-shown protected content through a transient auth
  // drop; the grace-timer effect above only redirects on a real, settled
  // logout. Spinner shows only before the route has ever passed.
  if ((mode === "auth" || mode === "role") && hasPassedRef.current) {
    return <>{children}</>;
  }
  return <LoadingScreen />;
}
