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
   * True when this session was created via the Anonymous provider
   * (demo / guest). Anonymous users have no email + no password —
   * each browser gets a fresh isolated session, so demos can't
   * share CV / application data with each other.
   */
  isDemo: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Convenience — same as `state.user?.isDemo ?? false`. */
  isDemo: boolean;
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
   * Start an isolated demo session via the Convex Anonymous provider.
   * Each call creates a fresh `users` row with no email / password;
   * the visitor gets their own sandbox that won't collide with other
   * concurrent demo visitors. Seeds starter data on first success.
   */
  loginAsDemo: () => Promise<AuthResult>;
  /** `to` defaults to the landing page. Pass a destination rather than
   *  navigating alongside the call — see the implementation. */
  logout: (to?: string) => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
}
