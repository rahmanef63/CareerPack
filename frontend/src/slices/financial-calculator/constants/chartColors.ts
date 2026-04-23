/**
 * Chart color constants used by the Financial Calculator's recharts
 * surfaces. Recharts passes these as SVG presentation attributes which
 * don't reliably resolve CSS custom properties across browsers, so they
 * stay as hex — audited in one file.
 *
 * Values aligned with the `modern-minimal` theme preset baked into
 * `shared/styles/index.css`:
 *   - barMin    → slate (neutral range floor)
 *   - barMid    → blue-500 (matches --chart-1)
 *   - barMax    → blue-700 (matches --chart-3)
 *   - compareA  → blue-500 (primary — "your city")
 *   - compareB  → amber-500 (complementary — "compare city")
 *   - gridLine  → slate-200 (CartesianGrid stroke)
 *   - tickText  → slate-500 (axis tick labels)
 *
 * If the default theme changes, update this file AND the index.css
 * --chart-1..5 values in lockstep.
 */

export const CHART_COLORS = {
  gridLine: "#e2e8f0",     // slate-200
  tickText: "#64748b",     // slate-500
  cursorFill: "rgba(148, 163, 184, 0.1)",
  barMin: "#94a3b8",       // slate-400 — de-emphasized
  barMid: "#3b82f6",       // blue-500 — matches --chart-1
  barMax: "#1d4ed8",       // blue-700 — matches --chart-3
  compareA: "#3b82f6",     // blue — "your city"
  compareB: "#f59e0b",     // amber — complementary "compare city"
} as const;
