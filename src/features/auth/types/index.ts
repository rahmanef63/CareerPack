/**
 * Auth feature types.
 * Extends base types with auth-specific interfaces.
 */

import type { BaseEntity, UserRole } from '@/shared/types';

// Re-export common types for convenience
export type { UserRole };

/**
 * User entity for auth feature.
 */
export interface AuthUser extends BaseEntity {
    email: string;
    name: string;
    role: UserRole;
    avatar?: string;
    lastLogin: string;
    isActive: boolean;
}

/**
 * Authentication state.
 */
export interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

/**
 * Login credentials.
 */
export interface LoginCredentials {
    email: string;
    password: string;
}

/**
 * Auth context value.
 */
export interface AuthContextValue {
    state: AuthState;
    login: (credentials: LoginCredentials) => Promise<boolean>;
    register: (credentials: LoginCredentials & { name: string }) => Promise<boolean>;
    logout: () => void;
    updateUser: (updates: Partial<AuthUser>) => void;
}
