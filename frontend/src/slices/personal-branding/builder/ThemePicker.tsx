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
}> = [
  {
    id: "linktree",
    preview: <LinktreeMini />,
  },
  {
    id: "bento",
    preview: <BentoMini />,
  },
  {
    id: "magazine",
    preview: <MagazineMini />,
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

function LinktreeMini() {
  return (
    <div className="flex h-full w-full flex-col items-center gap-1.5 px-3 pt-4">
      <span className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-from to-brand-to" />
      <span className="h-1.5 w-12 rounded-full bg-foreground/40" />
      <span className="h-1 w-10 rounded-full bg-foreground/20" />
      <div className="mt-2 w-full space-y-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "block h-3 w-full rounded-md",
              i === 0
                ? "bg-gradient-to-r from-brand-from to-brand-to opacity-90"
                : "bg-foreground/15",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function BentoMini() {
  return (
    <div className="grid h-full w-full grid-cols-2 gap-1 p-2">
      <div className="col-span-2 h-6 rounded bg-foreground/40" />
      <div className="h-10 rounded bg-foreground/15" />
      <div className="row-span-2 rounded bg-gradient-to-br from-brand-from to-brand-to opacity-80" />
      <div className="h-10 rounded bg-foreground/15" />
      <div className="h-6 rounded bg-foreground/15" />
      <div className="h-6 rounded bg-foreground/25" />
    </div>
  );
}

function MagazineMini() {
  return (
    <div className="flex h-full w-full flex-col px-3 pt-3">
      <span className="font-display text-[11px] font-bold leading-tight">
        Nama
      </span>
      <span className="mb-1.5 h-1 w-10 rounded-full bg-foreground/40" />
      <span className="h-3 w-3/4 rounded bg-foreground/30" />
      <div className="mt-2 space-y-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="block h-1 w-full rounded-full bg-foreground/15"
          />
        ))}
      </div>
    </div>
  );
}
