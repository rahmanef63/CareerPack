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
      // emails. See convex/authCheckEmail.ts.
      const checkRes = await fetch(convexHttpUrl("/api/auth/check-email"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: credentials.email }),
      });
      if (checkRes.status === 429) {
        return { ok: false, error: "Terlalu banyak percobaan login. Coba lagi nanti." };
      }
      if (!checkRes.ok) {
        return { ok: false, error: "Layanan login tidak tersedia. Coba lagi." };
      }
      const { exists } = (await checkRes.json()) as { exists: boolean };

      await signIn(
        "password",
        exists
          ? { email: credentials.email, password: credentials.password, flow: "signIn" }
          : {
              email: credentials.email,
              password: credentials.password,
              name: credentials.email.split("@")[0] || "User",
              flow: "signUp",
            }
      );

      try {
        await seedWithAuthWait();
      } catch (seedError) {
        console.warn("Seed dilewati:", seedError);
      }
      return { ok: true };
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

  const logout = async () => {
    // Push the user back to the marketing landing immediately so the
    // dashboard route doesn't flash an unauth empty-state during the
    // signOut round-trip. middleware would eventually redirect, but
    // explicit nav is faster + keeps the URL clean.
    router.push(ROUTES.marketing.landing);
    await signOut();
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
