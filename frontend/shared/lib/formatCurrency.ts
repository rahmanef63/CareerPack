/**
 * Indonesian Rupiah (IDR) formatters — single source of truth for
 * every currency display in the app. Replaces ~6 inline copies that
 * each rolled their own `Intl.NumberFormat("id-ID", {...})`.
 *
 * All accept `number | null | undefined` and return "—" for invalid
 * input rather than NaN/Invalid.
 */

type NumInput = number | null | undefined;

function toNum(v: NumInput): number | null {
  if (v === null || v === undefined) return null;
  if (!Number.isFinite(v)) return null;
  return v;
}

/** "Rp 1.234.567" — full IDR with grouping. Default everywhere. */
export function formatIDR(v: NumInput): string {
  const n = toNum(v);
  if (n === null) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/** "1.234.567" — number with id-ID grouping, no currency symbol. */
export function formatNumberID(v: NumInput): string {
  const n = toNum(v);
  if (n === null) return "—";
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(n);
}

/** Parse user-typed "1.234.567" / "Rp 1.234.567" back to a number.
 *  Returns 0 for unparseable input. */
export function parseNumberID(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/[^\d-]/g, "");
  if (!cleaned) return 0;
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : 0;
}

/** "Rp 1,2 jt" / "Rp 1,5 m" / "Rp 5,0 rb" — short-form currency for
 *  compact UIs (job cards, stat tiles). Falls back to full IDR below
 *  1 rb. */
export function formatShortIDR(v: NumInput): string {
  const n = toNum(v);
  if (n === null) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  // Descending units. The 0.99995 margin promotes values that would
  // round up to the next unit (e.g. 999_999 → "1,0 jt", not "1000,0 rb").
  const units: Array<[number, string]> = [
    [1_000_000_000, "m"],
    [1_000_000, "jt"],
    [1_000, "rb"],
  ];
  for (const [div, suffix] of units) {
    if (abs >= div * 0.99995) {
      return `${sign}Rp ${(abs / div).toFixed(1).replace(".", ",")} ${suffix}`;
    }
  }
  return formatIDR(n);
}
