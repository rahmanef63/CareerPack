/**
 * Operator-facing product name for an anonymous (Convex `Anonymous`
 * provider) session. The stable marker is an empty `email` — see
 * `useAuth`'s `isDemo`.
 *
 * Admin-only on purpose: the job-seeker-facing copy stays "Tamu"
 * ("Halo, Tamu 👋" is warm Indonesian; this English product name is not).
 * Lives in one file because five admin surfaces print it and the rename
 * from "anonim" already had to touch all five.
 */
export const GUEST_LABEL = "Demo Project Preview Guest";
