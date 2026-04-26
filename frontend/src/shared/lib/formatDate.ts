/**
 * Indonesian-locale date formatters — single source of truth for
 * every `id-ID` date display in the app. Using these instead of
 * inlining `new Intl.DateTimeFormat("id-ID", {...})` guarantees a
 * consistent visual style (Jan vs Januari, 24-hour vs 12-hour) and
 * cuts down on ~11 duplicate declarations across slices.
 *
 * All accept number (unix ms), Date, or ISO string. Invalid input
 * returns "—" rather than throwing, so UI never shows "Invalid Date".
 */

type DateInput = number | Date | string | null | undefined;

function toDate(v: DateInput): Date | null {
  if (v === null || v === undefined) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "23 Apr 2026" — the default app date format. */
export function formatDate(v: DateInput): string {
  const d = toDate(v);
  if (!d) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** "23 April 2026" — long-form month. Use for hero dates / emails. */
export function formatDateLong(v: DateInput): string {
  const d = toDate(v);
  if (!d) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** "Jumat, 23 April 2026" — weekday + long date. Calendar headers. */
export function formatDateFull(v: DateInput): string {
  const d = toDate(v);
  if (!d) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** "23 Apr" — compact, no year. Chart axes, tight table cells. */
export function formatDateShort(v: DateInput): string {
  const d = toDate(v);
  if (!d) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(d);
}

/** "23 Apr 2026, 14:30" — date + 24h time. Audit logs, timestamps. */
export function formatDateTime(v: DateInput): string {
  const d = toDate(v);
  if (!d) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/** Short month name only: "Apr". Calendar badges / agenda rails. */
export function formatMonthShort(v: DateInput): string {
  const d = toDate(v);
  if (!d) return "—";
  return new Intl.DateTimeFormat("id-ID", { month: "short" }).format(d);
}

/** "baru saja" / "5 menit lalu" / "3 hari lalu" / falls to formatDate
 *  when older than 30 days. Relative-time Indonesian. */
export function formatRelative(v: DateInput): string {
  const d = toDate(v);
  if (!d) return "—";
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "baru saja";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} hari lalu`;
  if (day < 30) return `${Math.floor(day / 7)} minggu lalu`;
  return formatDate(d);
}
