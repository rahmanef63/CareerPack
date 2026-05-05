/**
 * Helpers for parsing AI tool-call / completion output.
 *
 * `stripCodeFence` peels off optional triple-backtick fences (with or
 * without `json` lang tag) so downstream `JSON.parse` doesn't trip on
 * markdown-flavoured replies. `parseJsonOrThrow` runs strip + parse,
 * throwing a localized error so callers don't have to repeat the
 * try/catch boilerplate at every prompt site.
 *
 * Pure module — no Convex imports — so unit tests can import directly.
 *
 * Replaces 2 duplicated copies in `convex/matcher/external.ts` and
 * `convex/ai/actions.ts`. New AI prompt sites should import from here.
 */
export function stripCodeFence(s: string): string {
  const fenced = s.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : s.trim();
}

export function parseJsonOrThrow<T = unknown>(raw: string): T {
  const cleaned = stripCodeFence(raw);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error("AI mengembalikan format JSON tidak valid — coba lagi.");
  }
}

/**
 * Best-effort field readers for AI-extracted records. The AI sometimes
 * returns `null`, `undefined`, numbers as strings, or arrays-with-non-
 * strings. These coercers normalize them so the binder doesn't have to.
 */
export function readString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function readNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (trimmed === "") return undefined;
    if (!/^-?\d+(?:\.\d+)?$/.test(trimmed)) return undefined;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function readStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}
