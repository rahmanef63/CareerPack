"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery, useMutation, useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ROUTES } from "@/shared/lib/routes";
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
  const convex = useConvex();

  const userProfile = useQuery(api.profile.queries.getCurrentUser, isAuthenticated ? {} : "skip");
  const updateProfile = useMutation(api.profile.mutations.createOrUpdateProfile);
  const seedForCurrentUser = useMutation(api.seed.seedForCurrentUser);

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

    if (userProfile) {
      user = {
        id: userProfile._id,
        email: userProfile.email || "",
        name: userProfile.profile?.fullName || userProfile.email || "User",
        role: userProfile.profile?.role ?? "user",
        avatar: userProfile.avatarUrl ?? undefined,
        lastLogin: new Date().toISOString(),
        isActive: true,
        createdAt: userProfile._creationTime.toString(),
        updatedAt: userProfile._creationTime.toString(),
      };
    }

    return { user, isAuthenticated, isLoading };
  }, [isAuthenticated, authLoading, userProfile]);

  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    try {
      const exists = await convex.query(api.profile.queries.userExistsByEmail, {
        email: credentials.email,
      });

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
    <AuthContext.Provider value={{ state, login, register, logout, updateUser }}>
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
