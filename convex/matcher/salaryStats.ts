/**
 * Pure salary-statistics helpers — no Convex imports, so the
 * aggregation (currency separation + percentile math) is unit-testable
 * in plain vitest without convex-test.
 */

export interface SalaryRow {
  category?: string;
  currency?: string;
  salaryMin?: number;
  salaryMax?: number;
  workMode?: string;
}

export interface SalaryInsight {
  category: string;
  count: number;
  withSalaryCount: number;
  remotePct: number;
  currency: string;
  p25: number | null;
  p50: number | null;
  p75: number | null;
}

/**
 * Nearest-rank percentile over an ascending-sorted array. Uses `round`
 * (not `floor`) so small samples aren't biased toward the minimum —
 * e.g. p75 of [a,b] returns b, not a.
 */
export function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.round((sorted.length - 1) * p);
  return Math.round(sorted[idx]);
}

/** Currency with the most salaried listings in a category. Defaults USD. */
export function pickDominantCurrency(counts: Map<string, number>): string {
  let best = "USD";
  let max = 0;
  for (const [cur, n] of counts) {
    if (n > max) {
      max = n;
      best = cur;
    }
  }
  return best;
}

function midpoint(row: SalaryRow): number | null {
  const min = row.salaryMin;
  const max = row.salaryMax;
  let mid: number | null = null;
  if (min && max) mid = (min + max) / 2;
  else if (min) mid = min;
  else if (max) mid = max;
  if (mid === null || !Number.isFinite(mid) || mid <= 0) return null;
  return mid;
}

interface Bucket {
  // Salary midpoints split BY currency — IDR and USD must never land in
  // the same distribution (percentiles over mixed magnitudes are
  // meaningless: e.g. 30_000_000 IDR vs 120_000 USD).
  valuesByCurrency: Map<string, number[]>;
  count: number;
  remoteCount: number;
  currencies: Map<string, number>;
}

/**
 * Aggregate job listings into per-category salary insights. Percentiles
 * are computed over the dominant currency's salaries ONLY — never a
 * cross-currency mix — and `withSalaryCount` reflects that same
 * single-currency sample so the UI's "based on N" stays honest.
 */
export function summarizeSalaries(rows: readonly SalaryRow[]): SalaryInsight[] {
  const byCategory = new Map<string, Bucket>();

  for (const row of rows) {
    const cat = row.category ?? "other";
    const bucket: Bucket = byCategory.get(cat) ?? {
      valuesByCurrency: new Map(),
      count: 0,
      remoteCount: 0,
      currencies: new Map(),
    };
    bucket.count += 1;
    if (row.workMode === "remote") bucket.remoteCount += 1;

    const mid = midpoint(row);
    if (mid !== null) {
      const cur = row.currency ?? "USD";
      const arr = bucket.valuesByCurrency.get(cur) ?? [];
      arr.push(mid);
      bucket.valuesByCurrency.set(cur, arr);
      bucket.currencies.set(cur, (bucket.currencies.get(cur) ?? 0) + 1);
    }
    byCategory.set(cat, bucket);
  }

  return Array.from(byCategory.entries())
    .map(([category, b]) => {
      const dominantCurrency = pickDominantCurrency(b.currencies);
      const sorted = (b.valuesByCurrency.get(dominantCurrency) ?? [])
        .slice()
        .sort((a, b) => a - b);
      return {
        category,
        count: b.count,
        withSalaryCount: sorted.length,
        remotePct: b.count > 0 ? Math.round((b.remoteCount / b.count) * 100) : 0,
        currency: dominantCurrency,
        p25: percentile(sorted, 0.25),
        p50: percentile(sorted, 0.5),
        p75: percentile(sorted, 0.75),
      };
    })
    .sort((a, b) => b.count - a.count);
}
