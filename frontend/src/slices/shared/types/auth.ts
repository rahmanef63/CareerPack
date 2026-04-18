/**
 * Auth types — shared contract used by the auth slice UI (LoginPage) and
 * every other slice that needs the current authenticated user.
 */

import type { BaseEntity } from "./base-entity";
import type { UserRole } from "./common";

export interface AuthUser extends BaseEntity {
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  lastLogin: string;
  isActive: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextValue {
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: LoginCredentials & { name: string }) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}
