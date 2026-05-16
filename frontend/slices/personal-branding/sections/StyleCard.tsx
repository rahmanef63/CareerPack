"use client";

import { Palette, Type as TypeIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/utils";
import type {
  Bind,
  PublicStyle,
  StyleDensity,
  StyleFont,
  StyleRadius,
} from "../form/types";

const FONTS: ReadonlyArray<{ value: StyleFont; label: string; sample: string }> =
  [
    { value: "sans", label: "Sans-serif", sample: "font-sans" },
    { value: "serif", label: "Serif", sample: "font-serif" },
    { value: "mono", label: "Mono", sample: "font-mono" },
  ];

const RADII: ReadonlyArray<{ value: StyleRadius; label: string; demo: string }> =
  [
    { value: "none", label: "Tajam", demo: "rounded-none" },
    { value: "sm", label: "Halus", demo: "rounded-sm" },
    { value: "md", label: "Sedang", demo: "rounded-md" },
    { value: "lg", label: "Bulat", demo: "rounded-lg" },
    { value: "full", label: "Pill", demo: "rounded-full" },
  ];

const DENSITIES: ReadonlyArray<{ value: StyleDensity; label: string }> = [
  { value: "compact", label: "Padat" },
  { value: "normal", label: "Normal" },
  { value: "spacious", label: "Lapang" },
];

const PRIMARY_PRESETS: ReadonlyArray<{ value: string; name: string }> = [
  { value: "#6366f1", name: "Indigo" },
  { value: "#8b5cf6", name: "Violet" },
  { value: "#ec4899", name: "Pink" },
  { value: "#f59e0b", name: "Amber" },
  { value: "#10b981", name: "Emerald" },
  { value: "#0ea5e9", name: "Sky" },
  { value: "#ef4444", name: "Red" },
  { value: "#0f172a", name: "Slate" },
];

const HEX_RE = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

export interface StyleCardProps {
  bind: Bind;
  noCard?: boolean;
}

/**
 * Manual-mode "Style" customization. Works on top of the chosen
 * template — primary color + font family + border radius + spacing
 * density become CSS custom properties on the live page via the
 * iframe hydrator. Templates that haven't been re-themed yet still
 * pick up `--cp-primary` + `--cp-radius` through a universal-selector
 * override layer the hydrator injects.
 */
export function StyleCard({ bind, noCard = false }: StyleCardProps) {
  const style = bind("style");
  const value: PublicStyle = style.value ?? {};

  function update<K extends keyof PublicStyle>(key: K, v: PublicStyle[K]) {
    style.onChange({ ...value, [key]: v });
  }
  function clearKey<K extends keyof PublicStyle>(key: K) {
    const next = { ...value };
    delete next[key];
    style.onChange(next);
  }

  const primaryRaw = value.primary ?? "";
  const primaryValid = primaryRaw === "" || HEX_RE.test(primaryRaw);

  const fields = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Warna utama</Label>
        <div className="flex flex-wrap items-center gap-1.5">
          {PRIMARY_PRESETS.map((p) => {
            const active = value.primary?.toLowerCase() === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => update("primary", p.value)}
                aria-label={p.name}
                aria-pressed={active}
                className={cn(
                  "h-8 w-8 rounded-full border-2 transition-transform",
                  active
                    ? "scale-110 border-foreground shadow-sm"
                    : "border-transparent hover:scale-105",
                )}
                style={{ backgroundColor: p.value }}
              />
            );
          })}
          <button
            type="button"
            onClick={() => clearKey("primary")}
            className="rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
          >
            Default
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value.primary ?? "#6366f1"}
            onChange={(e) => update("primary", e.target.value.toLowerCase())}
            className="h-8 w-12 cursor-pointer rounded border border-border bg-background p-0.5"
            aria-label="Pilih warna kustom"
          />
          <Input
            value={primaryRaw}
            onChange={(e) =>
              update(
                "primary",
                e.target.value.startsWith("#")
                  ? e.target.value
                  : `#${e.target.value}`,
              )
            }
            placeholder="#6366f1"
            className={cn(
              "max-w-[160px] font-mono text-xs",
              !primaryValid && "border-destructive/60",
            )}
            aria-invalid={!primaryValid}
            maxLength={7}
          />
          {!primaryValid && (
            <span className="text-[10px] text-destructive">Format: #rrggbb</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Font</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {FONTS.map((f) => {
            const active = (value.font ?? "sans") === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => update("font", f.value)}
                aria-pressed={active}
                className={cn(
                  "rounded-md border px-2 py-2 text-center transition-colors",
                  f.sample,
                  active
                    ? "border-brand bg-brand-muted/40 text-foreground"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                <span className="block text-sm font-semibold">Aa</span>
                <span className="block text-[10px] text-muted-foreground">
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Lekukan sudut (radius)
        </Label>
        <div className="grid grid-cols-5 gap-1.5">
          {RADII.map((r) => {
            const active = (value.radius ?? "md") === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => update("radius", r.value)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-center gap-1 border p-2 text-[10px] transition-colors",
                  r.demo,
                  active
                    ? "border-brand bg-brand-muted/40 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                <span
                  className={cn("h-5 w-5 bg-foreground/70", r.demo)}
                  aria-hidden
                />
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Kerapatan spasi
        </Label>
        <div className="grid grid-cols-3 gap-1.5">
          {DENSITIES.map((d) => {
            const active = (value.density ?? "normal") === d.value;
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => update("density", d.value)}
                aria-pressed={active}
                className={cn(
                  "rounded-md border px-2 py-2 text-xs transition-colors",
                  active
                    ? "border-brand bg-brand-muted/40 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (noCard) return fields;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="h-4 w-4 text-brand" />
          Style — warna, font, radius
          <TypeIcon className="h-3 w-3 text-muted-foreground/70" aria-hidden />
        </CardTitle>
        <CardDescription>
          Custom layer di atas template. Pilih warna utama, font, dan
          kerapatan untuk mengubah feel halaman publik tanpa pindah
          template.
        </CardDescription>
      </CardHeader>
      <CardContent>{fields}</CardContent>
    </Card>
  );
}
