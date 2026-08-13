/**
 * Local-zone date-key helpers.
 *
 * Agenda rows store a bare `YYYY-MM-DD` with no zone, so BOTH directions of
 * the conversion have to stay in the user's local zone:
 *
 * - `d.toISOString().slice(0, 10)` is UTC. For a WIB (UTC+7) user everything
 *   picked before 07:00 names *yesterday* — the same bug that used to make
 *   "Jadwal Hari Ini" show the wrong day.
 * - `new Date("2026-08-13")` parses as UTC midnight. West of Greenwich that
 *   Date renders as the 12th.
 *
 * Both helpers also work with the `TZDate` instances react-day-picker hands
 * back when a `timeZone` prop is set: they override `getFullYear` /
 * `getMonth` / `getDate` to report zone-local parts.
 */

/** `YYYY-MM-DD` for a Date, read in the local (or the Date's own) zone. */
export function localDateKey(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Parse `YYYY-MM-DD` as LOCAL midnight (never UTC midnight). */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-");
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date(Number.NaN);
  }
  return new Date(year, month - 1, day);
}

/** Shift a date key by whole days, staying in the local zone. */
export function addDaysToKey(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return localDateKey(d);
}

/** Local midnight on the first of `d`'s month. */
export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Same calendar month AND year. */
export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
