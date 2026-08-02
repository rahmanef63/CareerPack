"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ROUTES } from "@/shared/lib/routes";
import { convexHttpUrl } from "@/shared/lib/env";
import type {
  AuthState,
  AuthContextValue,
  AuthResult,
  LoginCredentials,
  AuthUser,
} from "../types/auth";

/**
 * Extract a user-facing Indonesian message from whatever Convex bubbles
 * up. Convex wraps handler throws as `[Request ID: ...] Server Error\n
 * Uncaught Error: <real message>` — pull the real message out so the UI
 * can surface exactly why the call failed (e.g., password requirements).
 */
function extractAuthError(err: unknown): string {
  if (!(err instanceof Error)) return "Terjadi kesalahan. Coba lagi.";
  const msg = err.message ?? "";
  const match = msg.match(/Uncaught Error:\s*([^\n]+)/);
  if (match) return match[1].trim();
  const stripped = msg.replace(/^\[Request ID:[^\]]+\]\s*/, "").trim();
  return stripped || "Terjadi kesalahan. Coba lagi.";
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();

  const userProfile = useQuery(api.profile.queries.getCurrentUser, isAuthenticated ? {} : "skip");
  const updateProfile = useMutation(api.profile.mutations.createOrUpdateProfile);
  const seedForCurrentUser = useMutation(api.seed.seedForCurrentUser);
  const heartbeat = useMutation(api.profile.mutations.heartbeat);

  /**
   * Heartbeat — fires once on mount + every 5 min while authenticated.
   * Server throttles inserts to ≥4 min apart, so the cadence is safe
   * across multi-tab. Updates `userProfiles.lastActiveAt` for the
   * admin "active in last 24h" column. Also re-fires on tab focus
   * via the `visibilitychange` listener so a long-idle tab refreshes
   * its activity stamp the moment the user returns.
   */
  useEffect(() => {
    if (!isAuthenticated) return;
    const fire = () => {
      heartbeat({}).catch(() => {
        /* swallow — best-effort, no UI surface */
      });
    };
    fire();
    const interval = window.setInterval(fire, 5 * 60 * 1000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") fire();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isAuthenticated, heartbeat]);

  /**
   * Run `seedForCurrentUser` with bounded retry. After `signIn` resolves,
   * the WebSocket auth context can take ~50–500ms to attach (the token
   * is installed by `auth:store` running asynchronously). Without retry,
   * the seed mutation fires too early and throws "Tidak terautentikasi" —
   * which is swallowed, so neither starter data nor the welcome email
   * fire on the user's first login. 6 attempts × 200ms ≈ 1.2s budget.
   */
  const seedWithAuthWait = async () => {
    const ATTEMPTS = 6;
    const DELAY_MS = 200;
    for (let i = 0; i < ATTEMPTS; i++) {
      try {
        await seedForCurrentUser({});
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (!/Tidak terautentikasi/i.test(msg) || i === ATTEMPTS - 1) throw err;
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }
  };

  const state = useMemo<AuthState>(() => {
    const isLoading = authLoading || (isAuthenticated && userProfile === undefined);

    let user: AuthUser | null = null;
    // Anonymous Convex users have no email. That's the stable marker
    // for demo / guest sessions — simpler than threading a flag
    // through schema.
    const isDemo = Boolean(
      userProfile && !userProfile.email?.trim(),
    );

    if (userProfile) {
      user = {
        id: userProfile._id,
        email: userProfile.email || "",
        name: isDemo
          ? "Tamu"
          : userProfile.profile?.fullName || userProfile.email || "User",
        role: userProfile.profile?.role ?? "user",
        avatar: userProfile.avatarUrl ?? undefined,
        lastLogin: new Date().toISOString(),
        isActive: true,
        isDemo,
        createdAt: userProfile._creationTime.toString(),
        updatedAt: userProfile._creationTime.toString(),
      };
    }

    return { user, isAuthenticated, isLoading, isDemo };
  }, [isAuthenticated, authLoading, userProfile]);

  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    try {
      // IP rate-limited (30/hr) so attackers can't enumerate registered
      // emails. See convex/authCheckEmail.ts. `exists === null` means the
      // server declined to answer (over the per-IP cap — one CGNAT exit
      // IP carries a whole carrier's traffic on launch day). Treat an
      // unreachable/garbled endpoint the same way: "don't know" must
      // degrade to a blind attempt, never to a dead signup form.
      let exists: boolean | null = null;
      try {
        const checkRes = await fetch(convexHttpUrl("/api/auth/check-email"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: credentials.email }),
        });
        if (checkRes.ok) {
          exists = ((await checkRes.json()) as { exists: boolean | null }).exists ?? null;
        }
      } catch {
        /* network / DNS — fall through to the blind path */
      }

      const asSignIn = {
        email: credentials.email,
        password: credentials.password,
        flow: "signIn" as const,
      };
      const asSignUp = {
        email: credentials.email,
        password: credentials.password,
        name: credentials.email.split("@")[0] || "User",
        flow: "signUp" as const,
      };

      if (exists === null) {
        // signUp first, because it is the only flow that works for BOTH
        // cases: createAccountFromCredentials returns the existing account
        // when the supplied password verifies, so a returning user gets a
        // session rather than an error (@convex-dev/auth
        // server/implementation/mutations/createAccountFromCredentials.js).
        // It throws only on existing-account-with-wrong-password, and on a
        // password our validator rejects — signIn covers the latter for
        // accounts predating the 8-char rule.
        try {
          await signIn("password", asSignUp);
        } catch {
          try {
            await signIn("password", asSignIn);
          } catch {
            // Collapse to one message on purpose. The provider throws
            // "InvalidAccountId" vs "InvalidSecret" vs "Account … already
            // exists" — distinguishable, i.e. an enumeration oracle. Prod
            // Convex redacts uncaught Errors to "Server Error", but a dev
            // deployment does not, so don't lean on the deployment mode.
            throw new Error("Email atau kata sandi salah");
          }
        }
      } else {
        await signIn("password", exists ? asSignIn : asSignUp);
      }

      try {
        await seedWithAuthWait();
      } catch (seedError) {
        console.warn("Seed dilewati:", seedError);
      }
      // `!exists` is the only place that knows whether this call signed in or
      // signed up. Hand it back rather than making the caller guess — except
      // on the blind path, where a successful signUp is genuinely ambiguous
      // (new account vs. existing account whose password verified). Report
      // `undefined` there instead of guessing "returning user".
      return { ok: true, created: exists === null ? undefined : !exists };
    } catch (error) {
      const msg = extractAuthError(error);
      console.error("Login gagal:", msg);
      // Bump the per-IP login-failure bucket so brute-force scripts
      // running through the official client flow burn quota fast.
      // Fire-and-forget — surface the original auth error regardless.
      void fetch(convexHttpUrl("/api/auth/signin-attempt"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false }),
      }).catch(() => {});
      // Fallback to a friendlier generic when the server returns a bare
      // "Server Error" without a specific reason (usually wrong pwd).
      const isGeneric = /server error/i.test(msg) || msg.trim() === "";
      return { ok: false, error: isGeneric ? "Email atau kata sandi salah" : msg };
    }
  };

  const register = async (
    credentials: LoginCredentials & { name: string }
  ): Promise<AuthResult> => {
    try {
      await signIn("password", {
        email: credentials.email,
        password: credentials.password,
        name: credentials.name,
        flow: "signUp",
      });
      try {
        await seedWithAuthWait();
      } catch (seedError) {
        console.warn("Seed dilewati:", seedError);
      }
      return { ok: true };
    } catch (error) {
      const msg = extractAuthError(error);
      console.error("Registrasi gagal:", msg);
      return { ok: false, error: msg };
    }
  };

  /**
   * Demo / guest session — each click creates a brand-new Convex user
   * via the Anonymous provider. No shared account across visitors
   * (the old `demo@careerpack.id` pattern leaked data cross-user
   * because Convex is realtime). Demo accounts get the same minimal
   * starter seed real users do — no more rich Rizky persona that
   * polluted the admin user list with dozens of duplicates.
   */
  const loginAsDemo = async (): Promise<AuthResult> => {
    try {
      await signIn("anonymous", {});
      try {
        await seedWithAuthWait();
      } catch (seedError) {
        console.warn("Seed demo dilewati:", seedError);
      }
      return { ok: true };
    } catch (error) {
      const msg = extractAuthError(error);
      console.error("Demo sign-in gagal:", msg);
      return { ok: false, error: msg };
    }
  };

  // `to` exists because callers used to try `<Link href={x} onClick={logout}>`
  // to send someone somewhere specific after signing out — and that cannot
  // work. The click navigates immediately while the session is still live, the
  // destination's guard bounces it, and the awaited signOut then lands and
  // redirects again. The demo banner's "Daftar" button lost every high-intent
  // signup that way. Pass the destination in instead of racing it.
  const logout = async (to: string = ROUTES.marketing.landing) => {
    // Sign out FIRST, then navigate. Navigating while still authenticated let
    // MarketingLanding's "authenticated → /dashboard" redirect grab the window
    // and bounce landing→dashboard→spinner→login on every logout. RouteGuard's
    // hasPassedRef keeps the dashboard rendered through the signOut round-trip,
    // so there's no unauth empty-state flash to race against anymore.
    await signOut();
    router.replace(to);
  };

  const updateUser = async (updates: Partial<AuthUser>) => {
    if (!state.user) return;
    try {
      if (updates.name) {
        await updateProfile({
          fullName: updates.name,
          location: "",
          targetRole: "",
          experienceLevel: "",
          skills: [],
          interests: [],
        });
      }
    } catch (error) {
      console.error("Update profil gagal:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ state, login, register, loginAsDemo, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  }
  return context;
}
