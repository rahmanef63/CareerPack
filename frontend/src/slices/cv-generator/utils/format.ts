/**
 * Pure formatters for CV templates. No React deps so the same helpers
 * can power both the on-screen preview and a future server-side
 * (next/og or Satori) renderer.
 */

const MONTHS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/** Format `YYYY-MM` → `Mei 2024`. Empty / malformed input returns "". */
export function formatMonthYear(value: string | undefined): string {
  if (!value) return "";
  const [yearStr, monthStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month || month < 1 || month > 12) return value;
  return `${MONTHS_ID[month - 1]} ${year}`;
}

/** Pull "YYYY" out of a `YYYY-MM` or `YYYY-MM-DD` string. */
export function yearOnly(value: string | undefined): string {
  if (!value) return "";
  const year = value.split("-")[0];
  return /^\d{4}$/.test(year) ? year : "";
}

/**
 * Indonesian convention: derive age from DOB (YYYY-MM-DD). Returns null
 * when DOB is missing or unparseable so callers can hide the field.
 */
export function calcAge(dateOfBirth: string | undefined): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

/** Strip protocol + trailing slash so URLs look clean in print. */
export function tidyUrl(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}
