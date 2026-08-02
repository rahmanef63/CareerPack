/**
 * PII-safe redactors for logs.
 *
 * `console.error` lines flow into both stdout (Convex platform logs)
 * and `errorLogs` (admin panel). Both are read by humans who don't
 * need raw user emails — and admin-panel rows in particular are seen
 * by every admin/moderator, not just super-admin.
 */

export function redactEmail(email: string | null | undefined): string {
  if (!email || typeof email !== "string") return "[redacted]";
  const [user, domain] = email.split("@");
  if (!domain || !user) return "[redacted]";
  const head = user.slice(0, 1);
  return `${head}***@${domain}`;
}

/** First 8 chars of an opaque id — enough to grep, not enough to leak. */
export function redactId(id: string | null | undefined): string {
  if (!id || typeof id !== "string") return "[redacted]";
  if (id.length <= 8) return "[redacted]";
  return `${id.slice(0, 8)}…`;
}
