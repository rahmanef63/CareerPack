"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery, useMutation, useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type {
  AuthState,
  AuthContextValue,
  LoginCredentials,
  AuthUser,
} from "../types/auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const convex = useConvex();

  const userProfile = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const updateProfile = useMutation(api.users.createOrUpdateProfile);
  const seedForCurrentUser = useMutation(api.seed.seedForCurrentUser);

  const state = useMemo<AuthState>(() => {
    const isLoading = authLoading || (isAuthenticated && userProfile === undefined);

    let user: AuthUser | null = null;
    if (userProfile) {
      user = {
        id: userProfile._id,
        email: userProfile.email || "",
        name: userProfile.profile?.fullName || userProfile.email || "User",
        role: "user",
        lastLogin: new Date().toISOString(),
        isActive: true,
        createdAt: userProfile._creationTime.toString(),
        updatedAt: userProfile._creationTime.toString(),
      };
    }

    return { user, isAuthenticated, isLoading };
  }, [isAuthenticated, authLoading, userProfile]);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const exists = await convex.query(api.users.userExistsByEmail, {
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
        await seedForCurrentUser({});
      } catch (seedError) {
        console.warn("Seed dilewati:", seedError);
      }
      return true;
    } catch (error) {
      console.error("Login gagal:", error);
      return false;
    }
  };

  const register = async (
    credentials: LoginCredentials & { name: string }
  ): Promise<boolean> => {
    try {
      await signIn("password", {
        email: credentials.email,
        password: credentials.password,
        name: credentials.name,
        flow: "signUp",
      });
      try {
        await seedForCurrentUser({});
      } catch (seedError) {
        console.warn("Seed dilewati:", seedError);
      }
      return true;
    } catch (error) {
      console.error("Registrasi gagal:", error);
      return false;
    }
  };

  const logout = () => {
    signOut();
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
