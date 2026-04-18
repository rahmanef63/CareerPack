/**
 * Auth slice barrel — ships only the user-facing LoginPage.
 *
 * The auth context (`AuthProvider`, `useAuth`) and auth types live in
 * `@/slices/shared` because they are cross-cutting concerns consumed by
 * every slice. Import them from `@/slices/shared/hooks/useAuth` and
 * `@/slices/shared/types/auth` instead.
 */

export { LoginPage } from "./components/LoginPage";
export * from "./config";
