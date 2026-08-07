/**
 * Normalisers, match keys, caps and plausibility checks for the merge engine.
 *
 * The caps mirror `validateProfileFields` (convex/profile/mutations.ts) and
 * `validateCVUpdates` (convex/cv/mutations.ts) exactly. They are not advisory:
 * `capStringArray` and `assertCount` THROW on overflow, and a mutation that
 * throws rolls back the entire import — so the engine has to cap before the
 * server ever sees the payload.
 */

import { EXPERIENCE_LEVELS } from "../../../../convex/onboarding/types";

export const norm = (s: string) =>
  s.normalize("NFKC").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();

/**
 * Same cleanup for free-text that is displayed as written — bio, summary,
 * description. Line structure is content there: a résumé summary collapsed
 * onto one line reads as a wall, and `assertShortText` explicitly permits
 * tab / LF / CR, so there is nothing to gain by flattening them.
 */
export const normText = (s: string) =>
  s
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const isBlank = (v: unknown) => v == null || (typeof v === "string" && norm(v) === "");
export const eqLoose = (a?: string, b?: string) =>
  norm(a ?? "").toLowerCase() === norm(b ?? "").toLowerCase();

export const setKey = (s: string) => norm(s).toLowerCase().replace(/\.+$/, "");
export const nameKey = (s: string) => norm(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export const phoneKey = (s: string) => s.replace(/\D/g, "").replace(/^0/, "62").slice(-11);

/** URL-safe form of `nameKey`, for the human-readable half of a conflict id. */
export const slug = (s: string) => nameKey(s).replace(/ /g, "-");

/** "YYYY-MM". NEVER uses `new Date()` — an ISO round-trip through UTC can shift
 *  the day, and this string is a match key: a shifted day silently forks one
 *  job into two on the next import. */
export const ym = (s?: string) =>
  /^\d{4}-\d{2}/.test(s ?? "") ? s!.slice(0, 7) : /^\d{4}$/.test(s ?? "") ? `${s}-01` : "";

export const repairUrl = (s: string) =>
  /^https?:\/\//i.test(s) ? s : /^[\w.-]+\.[a-z]{2,}\//i.test(s) ? `https://${s}` : "";

/** Default deterministic id minter. */
export const mintId = (prefix: string, index: number) => `${prefix}-imp-${index}`;

/** Caps, all mirroring the server validators. */
export const CAP = {
  name: 120,
  phone: 30,
  email: 120,
  bio: 600,
  summary: 600,
  description: 2000,
  url: 300,
  date: 40,
  gpa: 20,
  experienceLevel: 40,
  setEntry: 60,
  achievement: 300,
  technology: 60,
  proficiencyLabel: 40,
  /** `CV_ENTRY_MAX` / `capStringArray`'s `maxEntries` — both throw above this. */
  entries: 50,
} as const;

export type Check =
  | { ok: true; value: string; note?: string }
  | { ok: false; reason: string };

/** Trim + cap a short single-line field. Over-cap truncates and reports it
 *  rather than dropping the value — a 130-char job title is still the title. */
export function shortText(max: number) {
  return (raw: string): Check => {
    const value = norm(raw);
    if (value.length === 0) return { ok: false, reason: "kosong" };
    if (value.length <= max) return { ok: true, value };
    return { ok: true, value: value.slice(0, max).trim(), note: `dipotong ke ${max} karakter` };
  };
}

/** Truncate long free-text at the last sentence boundary that fits, so the
 *  stored value ends as a sentence instead of mid-word. */
export function truncateSentence(raw: string, max: number): Check {
  const value = normText(raw);
  if (value.length === 0) return { ok: false, reason: "kosong" };
  if (value.length <= max) return { ok: true, value };
  const head = value.slice(0, max);
  const cut = Math.max(head.lastIndexOf("."), head.lastIndexOf("!"), head.lastIndexOf("?"));
  const trimmed = (cut > 0 ? head.slice(0, cut + 1) : head).trim();
  return { ok: true, value: trimmed, note: `dipotong ke ${trimmed.length} karakter (maksimal ${max})` };
}

export function longText(max: number) {
  return (raw: string): Check => truncateSentence(raw, max);
}

export function checkFullName(raw: string): Check {
  const value = norm(raw);
  if (value.length < 2 || value.length > 80) return { ok: false, reason: "panjangnya tidak wajar" };
  if ((value.match(/\p{L}/gu) ?? []).length < 2) return { ok: false, reason: "hampir tidak ada huruf" };
  if (/\d/.test(value)) return { ok: false, reason: "mengandung angka" };
  if (value.split(" ").length > 6) return { ok: false, reason: "terlalu banyak kata" };
  return { ok: true, value };
}

/** Mirrors `validateProfileFields`' phone rule verbatim — anything it would
 *  reject has to be dropped here, or the whole mutation throws. */
export function checkPhone(raw: string): Check {
  const value = norm(raw);
  if (!/^[+\d\s()-]{6,30}$/.test(value)) return { ok: false, reason: "format nomor tidak valid" };
  return { ok: true, value };
}

export function checkEmail(raw: string): Check {
  const value = norm(raw);
  if (value.length > CAP.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    return { ok: false, reason: "bukan alamat email valid" };
  }
  return { ok: true, value };
}

export function checkUrl(raw: string): Check {
  const repaired = repairUrl(norm(raw));
  if (repaired === "" || repaired.length > CAP.url) return { ok: false, reason: "bukan tautan valid" };
  try {
    new URL(repaired);
  } catch {
    return { ok: false, reason: "bukan tautan valid" };
  }
  return { ok: true, value: repaired };
}

export function checkExperienceLevel(raw: string): Check {
  const value = norm(raw).toLowerCase();
  const hit = EXPERIENCE_LEVELS.find((level) => level === value);
  return hit ? { ok: true, value: hit } : { ok: false, reason: "level tidak dikenali" };
}

/** Compare two URLs the way a human reads them: scheme and a trailing slash
 *  are not a difference worth a conflict card. */
export function eqUrl(a?: string, b?: string): boolean {
  const one = repairUrl(norm(a ?? ""));
  const two = repairUrl(norm(b ?? ""));
  if (one === "" || two === "") return eqLoose(a, b);
  try {
    const x = new URL(one);
    const y = new URL(two);
    const path = (u: URL) => u.pathname.replace(/\/+$/, "").toLowerCase();
    return x.host.toLowerCase().replace(/^www\./, "") === y.host.toLowerCase().replace(/^www\./, "")
      && path(x) === path(y);
  } catch {
    return eqLoose(a, b);
  }
}

export const eqPhone = (a?: string, b?: string) => phoneKey(a ?? "") === phoneKey(b ?? "");

/**
 * 1–5 proficiency, matching `appendSkills`, `mcpAppendSkills`' `1<=p<=5`
 * assertion and `toProficiencyLevel`'s `>=5→5` clamp. Three different scales
 * live in this codebase (0–100 sliders, 1–5 storage, label strings); landing
 * outside 1–5 is what mangles a user's tuned levels.
 */
const PROFICIENCY_SCALE: Record<string, number> = {
  pemula: 2, beginner: 2, basic: 2, dasar: 2,
  menengah: 3, intermediate: 3,
  mahir: 4, advanced: 4,
  ahli: 5, expert: 5, native: 5,
};

export function proficiencyFromLabel(label?: string): number {
  const hit = label ? PROFICIENCY_SCALE[setKey(label)] : undefined;
  return hit ?? 3;
}

/** Structural equality over the plain JSON shapes the engine deals in. Key
 *  order differs between a Convex row and a freshly built literal, so
 *  `JSON.stringify` comparison is not usable here. */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  const x = a as Record<string, unknown>;
  const y = b as Record<string, unknown>;
  const keysX = Object.keys(x).filter((k) => x[k] !== undefined);
  const keysY = Object.keys(y).filter((k) => y[k] !== undefined);
  if (keysX.length !== keysY.length) return false;
  return keysX.every((k) => deepEqual(x[k], y[k]));
}
