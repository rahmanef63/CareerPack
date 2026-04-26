"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useThemePreset } from "@/shared/providers/ThemePresetProvider";

/**
 * Resolve the current theme's `--chart-*` / semantic tokens into real
 * color strings suitable for recharts SVG presentation attributes
 * (`stroke=`, `fill=`), which don't reliably accept `var(--x)` across
 * browsers.
 *
 * Reads the computed OKLCH components from `:root` and wraps them with
 * `oklch(...)`. Re-runs whenever the theme mode or preset changes.
 */

type ChartColors = {
  gridLine: string;
  tickText: string;
  cursorFill: string;
  barMin: string;
  barMid: string;
  barMax: string;
  compareA: string;
  compareB: string;
};

const FALLBACK: ChartColors = {
  gridLine: "oklch(0.93 0.01 264.53)",
  tickText: "oklch(0.55 0.02 264.36)",
  cursorFill: "oklch(0.93 0.01 264.53 / 0.3)",
  barMin: "oklch(0.72 0 0)",
  barMid: "oklch(0.62 0.19 259.81)",
  barMax: "oklch(0.49 0.22 264.38)",
  compareA: "oklch(0.62 0.19 259.81)",
  compareB: "oklch(0.80 0.17 80)",
};

function readVar(name: string): string {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function toOklch(components: string, fallback: string): string {
  if (!components) return fallback;
  // components stored as raw `L C H` tuple in CSS vars
  return `oklch(${components})`;
}

function toOklchAlpha(components: string, alpha: number, fallback: string): string {
  if (!components) return fallback;
  return `oklch(${components} / ${alpha})`;
}

export function useChartColors(): ChartColors {
  const { resolvedTheme } = useTheme();
  const { presetName, isReady } = useThemePreset();
  const [colors, setColors] = useState<ChartColors>(FALLBACK);

  useEffect(() => {
    if (!isReady || typeof window === "undefined") return;
    // Defer one frame so any pending preset apply lands first.
    const id = requestAnimationFrame(() => {
      const border = readVar("--border");
      const mutedFg = readVar("--muted-foreground");
      const chart1 = readVar("--chart-1");
      const chart3 = readVar("--chart-3");
      const warning = readVar("--warning");

      setColors({
        gridLine: toOklchAlpha(border, 0.5, FALLBACK.gridLine),
        tickText: toOklch(mutedFg, FALLBACK.tickText),
        cursorFill: toOklchAlpha(mutedFg, 0.1, FALLBACK.cursorFill),
        barMin: toOklchAlpha(mutedFg, 0.6, FALLBACK.barMin),
        barMid: toOklch(chart1, FALLBACK.barMid),
        barMax: toOklch(chart3, FALLBACK.barMax),
        compareA: toOklch(chart1, FALLBACK.compareA),
        compareB: toOklch(warning, FALLBACK.compareB),
      });
    });
    return () => cancelAnimationFrame(id);
  }, [resolvedTheme, presetName, isReady]);

  return colors;
}
