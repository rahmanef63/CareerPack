/**
 * Chart color constants used by the Financial Calculator's recharts
 * surfaces. Recharts passes these as SVG presentation attributes which
 * don't reliably resolve CSS custom properties across browsers, so we
 * keep them as hex.
 *
 * Values are kept in step with the superspace theme preset in
 * `shared/styles/index.css`:
 *   - brand / brand-deep   → accent violet & darker violet
 *   - compareBar           → magenta pair (matches --brand-to)
 *   - gridLine / tickText  → neutral slate (readable in both modes)
 */

export const CHART_COLORS = {
  gridLine: "#e2e8f0",     // slate-200 — subtle CartesianGrid
  tickText: "#64748b",     // slate-500 — axis ticks
  cursorFill: "rgba(148, 163, 184, 0.1)",
  barMin: "#94a3b8",       // slate-400 — de-emphasized range floor
  barMid: "#8b5cf6",       // violet-500 — median (brand accent)
  barMax: "#6d28d9",       // violet-700 — max (brand deep)
  compareA: "#8b5cf6",     // violet for "your city"
  compareB: "#ec4899",     // magenta for "compare city"
} as const;
