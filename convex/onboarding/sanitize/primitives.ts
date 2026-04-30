/**
 * Primitive sanitisers used by per-section quickFill sanitisers.
 * All return `null`/`undefined` on bad input so callers can decide
 * whether the field is required (reject) or optional (skip).
 */

export function asString(v: unknown, max = 500): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/[ -]/g, "").trim();
  if (!t) return null;
  return t.slice(0, max);
}

export function optString(v: unknown, max = 500): string | undefined {
  const s = asString(v, max);
  return s ?? undefined;
}

export function asStringArray(v: unknown, maxItems = 50, maxLen = 100): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => asString(x, maxLen))
    .filter((x): x is string => Boolean(x))
    .slice(0, maxItems);
}

export function asInt(v: unknown, min: number, max: number): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const n = Math.round(v);
  if (n < min || n > max) return null;
  return n;
}

export function asBool(v: unknown): boolean {
  return v === true || v === "true" || v === 1;
}

export function isHttpUrl(v: unknown): string | undefined {
  const s = asString(v, 500);
  if (!s) return undefined;
  if (!/^https?:\/\//i.test(s)) return undefined;
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

/**
 * Coerce dates to YYYY-MM-DD.
 * Accepts: ISO date, YYYY-MM-DD, YYYY-MM, Mon YYYY, MM/DD/YYYY,
 * Date object, ms timestamp.
 */
export function asISODate(v: unknown): string | undefined {
  if (typeof v === "number" && Number.isFinite(v)) {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const s = typeof v === "string" ? v.trim() : null;
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return undefined;
}

/** YYYY-MM (used by CV experience start/end). */
export function asYearMonth(v: unknown): string | undefined {
  const iso = asISODate(v);
  return iso ? iso.slice(0, 7) : undefined;
}

export function asDateMs(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return Math.round(v);
  const iso = asISODate(v);
  if (!iso) return undefined;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? undefined : d.getTime();
}

export function pickEnum<T extends string>(
  v: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  if (typeof v !== "string") return fallback;
  const lower = v.trim().toLowerCase();
  for (const a of allowed) {
    if (lower === a.toLowerCase()) return a;
  }
  return fallback;
}

/** Returns the matched enum value, or `null` if the input didn't match
 *  any allowed value (so callers can distinguish "absent" from "default"). */
export function matchEnum<T extends string>(
  v: unknown,
  allowed: readonly T[],
): T | null {
  if (typeof v !== "string") return null;
  const lower = v.trim().toLowerCase();
  for (const a of allowed) {
    if (lower === a.toLowerCase()) return a;
  }
  return null;
}

/** Picks a string from any of the candidate paths. AI assistants
 *  often flatten or rename fields ("name" instead of "fullName",
 *  email at root instead of nested in personalInfo). */
export function pickString(candidates: Array<unknown>, max: number): string | null {
  for (const c of candidates) {
    const s = asString(c, max);
    if (s) return s;
  }
  return null;
}

let _idCounter = 0;
export function localId(prefix: string): string {
  _idCounter = (_idCounter + 1) % 1_000_000;
  return `${prefix}-${Date.now().toString(36)}-${_idCounter}`;
}
