/**
 * Shape validator for the CV-import parse (`api.ai.resume.parseResume`).
 *
 * Deliberately NOT `coerceProfileShape`: that one emits `""` / `[]` for every
 * missing field and hard-defaults `experienceLevel` to `"mid-level"`, which
 * makes "the AI found nothing" indistinguishable from "the AI said empty".
 * The merge engine treats an absent key as "the CV did not say" and a present
 * one as a value worth writing, so the whole design rests on OMITTING keys
 * rather than filling them — a `""` here would silently overwrite a real
 * profile field, and a defaulted `experienceLevel` would demote a senior.
 */

export interface ParsedResume {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  bio?: string;
  linkedin?: string;
  portfolio?: string;
  dateOfBirth?: string;
  experienceLevel?: "entry-level" | "junior" | "mid-level" | "senior" | "lead";
  skills?: string[];
  interests?: string[];
  languages?: { language: string; proficiency?: string }[];
  experience?: {
    company: string;
    position?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    description?: string;
    achievements?: string[];
  }[];
  education?: {
    institution: string;
    degree?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
  }[];
  certifications?: { name: string; issuer?: string; date?: string; expiryDate?: string }[];
  projects?: { name: string; description?: string; technologies?: string[]; link?: string }[];
}

/** Row cap per array. The merge engine caps again at the CV's own 50-entry
 *  limit; this one only bounds what a runaway model can hand us. */
const MAX_ROWS = 60;

const EXPERIENCE_LEVELS: NonNullable<ParsedResume["experienceLevel"]>[] = [
  "entry-level",
  "junior",
  "mid-level",
  "senior",
  "lead",
];

const SCALAR_KEYS = [
  "fullName",
  "email",
  "phone",
  "location",
  "headline",
  "summary",
  "bio",
  "linkedin",
  "portfolio",
  "dateOfBirth",
] as const;

/** `undefined` for anything that is not a non-empty string. Trims the edges
 *  but keeps interior `\n` — the engine needs the line structure of a summary
 *  or a description, and truncates downstream. */
function str(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function strArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: string[] = [];
  for (const item of value) {
    const s = str(item);
    if (s !== undefined) out.push(s);
    if (out.length >= MAX_ROWS) break;
  }
  return out.length > 0 ? out : undefined;
}

function rows<T>(
  value: unknown,
  map: (row: Record<string, unknown>) => T | null,
): T[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: T[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const mapped = map(item as Record<string, unknown>);
    if (mapped) out.push(mapped);
    if (out.length >= MAX_ROWS) break;
  }
  return out.length > 0 ? out : undefined;
}

/** Copies `key` onto `target` only when the coerced value exists. Writing
 *  `target[key] = undefined` would put the key back in `Object.keys`, which
 *  is exactly what the omit-when-absent contract forbids. */
function put<T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: T[K] | undefined,
): void {
  if (value !== undefined) target[key] = value;
}

/** Would this value be dropped by the coercers below anyway? */
function isEmptyish(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function matchLevel(value: unknown): ParsedResume["experienceLevel"] {
  const s = str(value)?.toLowerCase();
  return EXPERIENCE_LEVELS.find((level) => level === s);
}

export function coerceResumeShape(parsed: unknown): ParsedResume {
  const root = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  // Models answer either flat or with the identity fields nested under
  // `profile` while the arrays stay at the root, so read from both. A blank
  // key in the wrapper must not shadow a real one at the root: a model that
  // echoes the schema's `"fullName": ""` inside `profile` while filling it in
  // at the root would otherwise erase the only copy we have.
  const nested =
    root.profile && typeof root.profile === "object" && !Array.isArray(root.profile)
      ? (root.profile as Record<string, unknown>)
      : {};
  const src: Record<string, unknown> = { ...root };
  for (const [key, value] of Object.entries(nested)) {
    if (!isEmptyish(value)) src[key] = value;
  }

  const out: ParsedResume = {};
  for (const key of SCALAR_KEYS) put(out, key, str(src[key]));
  put(out, "experienceLevel", matchLevel(src.experienceLevel));
  put(out, "skills", strArray(src.skills));
  put(out, "interests", strArray(src.interests));

  put(
    out,
    "languages",
    rows(src.languages, (row) => {
      const language = str(row.language);
      if (!language) return null;
      const item: NonNullable<ParsedResume["languages"]>[number] = { language };
      put(item, "proficiency", str(row.proficiency));
      return item;
    }),
  );

  put(
    out,
    "experience",
    rows(src.experience, (row) => {
      const company = str(row.company);
      if (!company) return null;
      const item: NonNullable<ParsedResume["experience"]>[number] = { company };
      put(item, "position", str(row.position));
      put(item, "startDate", str(row.startDate));
      put(item, "endDate", str(row.endDate));
      put(item, "current", typeof row.current === "boolean" ? row.current : undefined);
      put(item, "description", str(row.description));
      put(item, "achievements", strArray(row.achievements));
      return item;
    }),
  );

  put(
    out,
    "education",
    rows(src.education, (row) => {
      const institution = str(row.institution);
      if (!institution) return null;
      const item: NonNullable<ParsedResume["education"]>[number] = { institution };
      put(item, "degree", str(row.degree));
      put(item, "field", str(row.field));
      put(item, "startDate", str(row.startDate));
      put(item, "endDate", str(row.endDate));
      put(item, "gpa", str(row.gpa));
      return item;
    }),
  );

  put(
    out,
    "certifications",
    rows(src.certifications, (row) => {
      const name = str(row.name);
      if (!name) return null;
      const item: NonNullable<ParsedResume["certifications"]>[number] = { name };
      put(item, "issuer", str(row.issuer));
      put(item, "date", str(row.date));
      put(item, "expiryDate", str(row.expiryDate));
      return item;
    }),
  );

  put(
    out,
    "projects",
    rows(src.projects, (row) => {
      const name = str(row.name);
      if (!name) return null;
      const item: NonNullable<ParsedResume["projects"]>[number] = { name };
      put(item, "description", str(row.description));
      put(item, "technologies", strArray(row.technologies));
      put(item, "link", str(row.link));
      return item;
    }),
  );

  return out;
}
