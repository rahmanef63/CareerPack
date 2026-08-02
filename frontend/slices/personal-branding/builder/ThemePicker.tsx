"use client";

import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { PersonalBrandingTheme } from "../blocks/types";
import { THEME_LABELS } from "../blocks/types";

interface Props {
  value: PersonalBrandingTheme;
  onChange: (theme: PersonalBrandingTheme) => void;
}

const THEMES: ReadonlyArray<{
  id: PersonalBrandingTheme;
  preview: React.ReactNode;
  premium?: boolean;
}> = [
  {
    id: "template-v1",
    preview: <PurpleGlassMini />,
    premium: true,
  },
  {
    id: "template-v2",
    preview: <EditorialCreamMini />,
    premium: true,
  },
  {
    id: "template-v3",
    preview: <PremiumDarkMini />,
    premium: true,
  },
];

export function ThemePicker({ value, onChange }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {THEMES.map((t) => {
        const active = t.id === value;
        const meta = THEME_LABELS[t.id];
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "group relative flex flex-col gap-2 rounded-xl border bg-card p-3 text-left transition-all",
              active
                ? "border-brand ring-2 ring-brand/30"
                : "border-border hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md",
            )}
          >
            <div className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-lg bg-muted/40">
              {t.preview}
            </div>
            {t.premium && (
              <span className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-50 shadow-sm">
                Premium
              </span>
            )}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{meta.label}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {meta.tagline}
                </p>
              </div>
              {active && (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* HTML template mini-previews — match each template's aesthetic */

function PurpleGlassMini() {
  return (
    <div
      className="relative flex h-full w-full flex-col gap-1.5 overflow-hidden rounded-md p-2"
      style={{
        background:
          "radial-gradient(circle at 70% 10%, rgba(139,92,246,0.55), transparent 55%), linear-gradient(180deg, #0a0d1c 0%, #050816 100%)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="h-1.5 w-6 rounded bg-white/40" />
        <span className="h-1.5 w-3 rounded bg-white/20" />
      </div>
      <span className="mt-1 h-1 w-12 rounded-full bg-purple-300/60" />
      <span className="h-3 w-full rounded bg-white/80" />
      <span className="h-3 w-3/4 rounded bg-white/55" />
      <span className="h-2 w-2/3 rounded bg-white/25" />
      <div className="mt-1 flex gap-1">
        <span className="h-3 w-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600" />
        <span className="h-3 w-6 rounded-full border border-white/30 bg-white/5" />
      </div>
      <div className="absolute bottom-1.5 left-1.5 right-1.5 grid grid-cols-5 gap-0.5 rounded-md border border-white/10 bg-black/40 p-0.5 backdrop-blur">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              "h-2 rounded-sm",
              i === 0 ? "bg-purple-300/80" : "bg-white/15",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function EditorialCreamMini() {
  return (
    <div
      className="relative flex h-full w-full flex-col gap-1.5 overflow-hidden rounded-md p-2"
      style={{
        background:
          "radial-gradient(circle at 18% 0%, rgba(177,138,91,0.18), transparent 40%), #faf7f1",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-[10px] font-semibold leading-none text-stone-900">
          YN<span className="text-amber-700">.</span>
        </span>
        <span className="h-1 w-3 rounded bg-stone-400/40" />
      </div>
      <span className="mt-1 h-1 w-8 rounded-full bg-amber-700/70" />
      <span className="h-3 w-full rounded bg-stone-800/80" />
      <span className="h-3 w-2/3 rounded bg-stone-800/55" />
      <span className="h-2 w-3/4 rounded bg-stone-500/30" />
      <div className="mt-1 flex gap-1">
        <span className="h-3 w-7 rounded-full bg-gradient-to-b from-amber-500 to-amber-700" />
        <span className="h-3 w-6 rounded-full border border-stone-400/40 bg-white/60" />
      </div>
      <div className="absolute bottom-1.5 left-1.5 right-1.5 grid grid-cols-5 gap-0.5 rounded-md border border-stone-300 bg-stone-50/90 p-0.5 backdrop-blur">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              "h-2 rounded-sm",
              i === 0 ? "bg-amber-500/70" : "bg-stone-300/60",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function PremiumDarkMini() {
  return (
    <div
      className="relative flex h-full w-full flex-col gap-1.5 overflow-hidden rounded-md p-2"
      style={{
        background:
          "radial-gradient(circle at 90% 8%, rgba(196,164,127,0.18), transparent 40%), linear-gradient(135deg, #0d0f0e 0%, #080909 100%)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-[10px] font-semibold leading-none text-amber-100">
          YN<span className="text-amber-300">.</span>
        </span>
        <span className="h-1 w-3 rounded bg-amber-100/40" />
      </div>
      <span className="mt-1 h-1 w-8 rounded-full bg-amber-300/70" />
      <span className="h-3 w-full rounded bg-amber-50/85" />
      <span className="h-3 w-2/3 rounded bg-amber-50/60" />
      <span className="h-2 w-3/4 rounded bg-amber-50/25" />
      <div className="mt-1 flex gap-1">
        <span className="h-3 w-7 rounded-full bg-gradient-to-b from-amber-200 to-amber-500" />
        <span className="h-3 w-6 rounded-full border border-amber-50/20 bg-white/5" />
      </div>
      <div className="absolute bottom-1.5 left-1.5 right-1.5 grid grid-cols-5 gap-0.5 rounded-md border border-amber-50/10 bg-black/55 p-0.5 backdrop-blur">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              "h-2 rounded-sm",
              i === 0 ? "bg-amber-300/80" : "bg-amber-50/15",
            )}
          />
        ))}
      </div>
    </div>
  );
}
