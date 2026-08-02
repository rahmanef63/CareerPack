/**
 * Build a stable, content-derived idempotency key.
 *
 * Same (scope, parts) → same key → backend `withIdempotency` cache hits
 * on WebSocket retry or rapid double-click. Inputs change → key changes →
 * fresh upstream call.
 *
 * 32-bit FNV-1a — collision-tolerant for per-user keyspace (cache is
 * scoped by userId in `aiIdempotency.by_user_key`).
 */
export function makeIdempotencyKey(
  scope: string,
  parts: ReadonlyArray<string | number | undefined | null>,
): string {
  const joined = parts.map((p) => (p == null ? "_" : String(p))).join("|");
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < joined.length; i++) {
    h ^= joined.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${scope}:${h.toString(16)}:${joined.length}`;
}
