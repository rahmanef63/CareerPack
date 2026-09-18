export type AuthReadiness = {
  auth: boolean;
  google: boolean;
} | null;

/**
 * OAuth must fail closed: only an explicit backend `google: true` may enable
 * the sign-in action. A pending, failed, malformed, or negative readiness
 * probe must never call an unregistered provider.
 */
export function isGoogleAuthReady(readiness: AuthReadiness): boolean {
  return readiness?.google === true;
}

export function isAuthReadinessKnown(readiness: AuthReadiness): boolean {
  return readiness !== null;
}
