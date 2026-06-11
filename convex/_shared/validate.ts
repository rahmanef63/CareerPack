/**
 * Small input-cap helpers for mutation args. Convex validators (`v.*`)
 * enforce shape/type but not length, so user free-text can otherwise be
 * stored unbounded. Errors are Indonesian to match the rest of the app.
 */

/** Trim + require non-empty, capped at `max`. Throws if empty or too long. */
export function requireLen(field: string, value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) {
    throw new Error(`${field} harus 1-${max} karakter`);
  }
  return trimmed;
}

/**
 * Trim an OPTIONAL string and cap at `max`. Returns `undefined` for
 * absent/blank input (so clearing a field works), throws only when the
 * value exceeds `max`.
 */
export function capLen(
  field: string,
  value: string | undefined,
  max: number,
): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  if (trimmed.length > max) {
    throw new Error(`${field} maksimal ${max} karakter`);
  }
  return trimmed;
}
