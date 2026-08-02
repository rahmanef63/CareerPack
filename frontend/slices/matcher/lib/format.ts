/**
 * Display helpers shared between JobCard + JobDetailDialog.
 * Kept tiny and pure — no React, no hooks.
 */

export function formatSalary(min?: number, max?: number, currency = "IDR"): string {
  if (!min && !max) return "Gaji dinegosiasikan";
  const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}jt` : `${n.toLocaleString()}`;
  if (min && max) return `${currency} ${fmt(min)}–${fmt(max)}`;
  return `${currency} ${fmt((min ?? max) as number)}`;
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return "Hari ini";
  if (diff < 2 * day) return "Kemarin";
  if (diff < 7 * day) return `${Math.floor(diff / day)}h`;
  return `${Math.floor(diff / (7 * day))}mg`;
}

/** Absolute date for tooltip — locale-aware, drops the year if same. */
export function formatPostedDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  if (d.getFullYear() !== now.getFullYear()) opts.year = "numeric";
  return d.toLocaleDateString("id-ID", opts);
}
