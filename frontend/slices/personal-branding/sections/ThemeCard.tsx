"use client";

import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  TEMPLATE_THEMES,
  THEME_LABELS,
  type PersonalBrandingTheme,
} from "../blocks/types";
import type { Bind } from "../form/types";

export interface ThemeCardProps {
  bind: Bind;
  /** True when custom HTML is in play — the picker still saves, but the
   *  choice has no effect until the custom HTML is removed. */
  overridden?: boolean;
}

/**
 * Template picker.
 *
 * It used to render three hand-drawn mini-previews of each template: ~110
 * lines of decorative JSX reimplementing designs that live in 80 KB HTML
 * files, guaranteed to drift the moment either side changed. The live preview
 * pane next to this card shows the real thing, so the fake one is gone.
 */
export function ThemeCard({ bind, overridden = false }: ThemeCardProps) {
  const theme = bind("theme");
  return (
    <div className="space-y-3">
      {overridden && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
          Halaman kamu sedang pakai HTML kustom, jadi template di bawah belum
          dipakai. Hapus HTML kustom untuk kembali ke template.
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {TEMPLATE_THEMES.map((id: PersonalBrandingTheme) => {
          const active = id === theme.value;
          const meta = THEME_LABELS[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => theme.onChange(id)}
              className={cn(
                "flex items-start justify-between gap-3 rounded-xl border bg-card p-3 text-left transition-all",
                active
                  ? "border-brand ring-2 ring-brand/30"
                  : "border-border hover:border-brand/40 hover:shadow-sm",
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{meta.label}</p>
                <p className="text-xs text-muted-foreground">{meta.tagline}</p>
              </div>
              {active && (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
