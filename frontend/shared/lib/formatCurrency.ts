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

/** "Rp 1,2 jt" / "Rp 1,5 m" — short-form currency for compact UIs
 *  (job cards, stat tiles). Falls back to full IDR < 1 jt. */
export function formatShortIDR(v: NumInput): string {
  const n = toNum(v);
  if (n === null) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1).replace(".", ",")} m`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${(abs / 1_000).toFixed(1).replace(".", ",")} rb`;
  }
  return formatIDR(n);
}
