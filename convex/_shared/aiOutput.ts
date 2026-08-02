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

// ---------------------------------------------------------------------------
// Shape validators for AI extraction output
// ---------------------------------------------------------------------------

export type ParsedJobShape = {
  title: string;
  company: string;
  location: string;
  workMode: "remote" | "hybrid" | "onsite";
  employmentType: "full-time" | "part-time" | "contract" | "internship";
  seniority: "junior" | "mid-level" | "senior" | "lead";
  salaryMin: number | null;
  salaryMax: number | null;
  currency: "IDR" | "USD" | "EUR" | null;
  description: string;
  requiredSkills: string[];
  applyUrl: string | null;
};

const WORK_MODES: ParsedJobShape["workMode"][] = ["remote", "hybrid", "onsite"];
const EMP_TYPES: ParsedJobShape["employmentType"][] = ["full-time", "part-time", "contract", "internship"];
const SENIORITIES: ParsedJobShape["seniority"][] = ["junior", "mid-level", "senior", "lead"];
const CURRENCIES: NonNullable<ParsedJobShape["currency"]>[] = ["IDR", "USD", "EUR"];

function pickEnum<T extends string>(v: unknown, allowed: T[], fallback: T): T {
  return typeof v === "string" && (allowed as string[]).includes(v) ? (v as T) : fallback;
}

function pickNullableEnum<T extends string>(v: unknown, allowed: T[]): T | null {
  return typeof v === "string" && (allowed as string[]).includes(v) ? (v as T) : null;
}

/**
 * Coerce + validate an AI-parsed job-listing shape. Returns a fully-
 * typed `ParsedJobShape` with safe defaults for missing/malformed fields.
 *
 * Used by the matcher's `parseJobFromText` action — keeps the action
 * thin (callAI → parseJsonOrThrow → coerceJobShape → return) and gives
 * us a unit-testable boundary that doesn't need the AI proxy mocked.
 */
export function coerceJobShape(parsed: unknown): ParsedJobShape {
  const obj = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  return {
    title: readString(obj.title),
    company: readString(obj.company),
    location: readString(obj.location),
    workMode: pickEnum(obj.workMode, WORK_MODES, "onsite"),
    employmentType: pickEnum(obj.employmentType, EMP_TYPES, "full-time"),
    seniority: pickEnum(obj.seniority, SENIORITIES, "mid-level"),
    salaryMin: readNumber(obj.salaryMin) ?? null,
    salaryMax: readNumber(obj.salaryMax) ?? null,
    currency: pickNullableEnum(obj.currency, CURRENCIES),
    description: readString(obj.description),
    requiredSkills: readStringArray(obj.requiredSkills),
    applyUrl: typeof obj.applyUrl === "string" && obj.applyUrl.length > 0 ? obj.applyUrl : null,
  };
}

export type ParsedProfileShape = {
  profile: {
    fullName: string;
    phone: string;
    location: string;
    targetRole: string;
    experienceLevel: "entry-level" | "junior" | "mid-level" | "senior" | "lead";
    bio: string;
    skills: string[];
    interests: string[];
  };
};

const EXP_LEVELS: ParsedProfileShape["profile"]["experienceLevel"][] = [
  "entry-level",
  "junior",
  "mid-level",
  "senior",
  "lead",
];

/**
 * Coerce + validate an AI-parsed profile-import shape. Mirrors
 * `coerceJobShape` for the `parseImportText` action.
 */
export function coerceProfileShape(parsed: unknown): ParsedProfileShape {
  const root = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  const profileRaw = (root.profile && typeof root.profile === "object" ? root.profile : root) as Record<string, unknown>;
  return {
    profile: {
      fullName: readString(profileRaw.fullName),
      phone: readString(profileRaw.phone),
      location: readString(profileRaw.location),
      targetRole: readString(profileRaw.targetRole),
      experienceLevel: pickEnum(profileRaw.experienceLevel, EXP_LEVELS, "mid-level"),
      bio: readString(profileRaw.bio),
      skills: readStringArray(profileRaw.skills),
      interests: readStringArray(profileRaw.interests),
    },
  };
}
