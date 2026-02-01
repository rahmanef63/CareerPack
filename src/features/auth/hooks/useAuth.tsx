import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { AuthState, AuthContextValue, LoginCredentials, AuthUser } from '../types';
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
    const { signIn, signOut } = useAuthActions();

    // Fetch user details if authenticated
    const userProfile = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
    const updateProfile = useMutation(api.users.createOrUpdateProfile);

    const state = useMemo<AuthState>(() => {
        const isLoading = authLoading || (isAuthenticated && userProfile === undefined);

        let user: AuthUser | null = null;
        if (userProfile) {
            // Map Convex user + profile to AuthUser
            user = {
                id: userProfile._id,
                email: userProfile.email || "",
                name: userProfile.profile?.fullName || userProfile.email || "User",
                role: "user", // Default role
                lastLogin: new Date().toISOString(),
                isActive: true,
                createdAt: userProfile._creationTime.toString(),
                updatedAt: userProfile._creationTime.toString(),
            };
        }

        return {
            user,
            isAuthenticated,
            isLoading,
        };
    }, [isAuthenticated, authLoading, userProfile]);

    const login = async (credentials: LoginCredentials): Promise<boolean> => {
        try {
            await signIn("password", {
                email: credentials.email,
                password: credentials.password,
                flow: "signIn"
            });
            // signIn typically redirects or handles session, returning void.
            // If it doesn't throw, we assume success or pending.
            return true;
        } catch (error) {
            console.error("Login failed:", error);
            return false;
        }
    };

    const register = async (credentials: LoginCredentials & { name: string }): Promise<boolean> => {
        try {
            await signIn("password", {
                email: credentials.email,
                password: credentials.password,
                name: credentials.name,
                flow: "signUp"
            });
            return true;
        } catch (error) {
            console.error("Registration failed:", error);
            return false;
        }
    };

    const logout = () => {
        signOut();
    };

    const updateUser = async (updates: Partial<AuthUser>) => {
        if (!state.user) return;

        // Basic mapping - ideally this should be more robust
        try {
            if (updates.name) {
                await updateProfile({
                    fullName: updates.name,
                    location: "", // Required args need to be handled
                    targetRole: "",
                    experienceLevel: "",
                    skills: [],
                    interests: []
                });
            }
        } catch (error) {
            console.error("Update profile failed:", error);
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
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
