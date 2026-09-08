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
  /**
   * True for demo / guest mode. New demo sessions are browser-local so the
   * product remains explorable when Convex/auth is unavailable; legacy
   * Anonymous-provider sessions are still recognized for compatibility.
   */
  isDemo: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Convenience — same as `state.user?.isDemo ?? false`. */
  isDemo: boolean;
  /**
   * True only for the backend-independent browser demo. This lets destructive
   * account actions skip server mutations while keeping legacy Anonymous demo
   * sessions compatible during the migration.
   */
  isLocalDemo: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export type AuthResult =
  /**
   * `created` is set by `login()`, which is login-or-register in one call: true
   * when the email was unknown and an account was just made. Callers need it to
   * avoid greeting a brand-new user with "welcome back" — which is not just
   * wrong-footed, it hides the typo case, where someone who mistyped their email
   * silently lands in a second empty account and is told they are returning.
   */
  | { ok: true; created?: boolean }
  | { ok: false; error: string };

export interface AuthContextValue {
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  register: (credentials: LoginCredentials & { name: string }) => Promise<AuthResult>;
  /**
   * Start a browser-local demo session. Feature slices hydrate their existing
   * `careerpack:demo:*` overlays, so no backend account or working auth service
   * is required and concurrent demo visitors remain isolated.
   */
  loginAsDemo: () => Promise<AuthResult>;
  /** `to` defaults to the landing page. Pass a destination rather than
   *  navigating alongside the call — see the implementation. */
  logout: (to?: string) => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
}
