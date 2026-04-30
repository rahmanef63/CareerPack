"use client";

import { Switch } from "@/shared/components/ui/switch";
import { cn } from "@/shared/lib/utils";
import { CV_TEMPLATES } from "../../constants";
import type { CVTemplateId } from "../../types";

interface PrefToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function PrefToggle({ label, description, checked, onChange }: PrefToggleProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-muted/30 p-3">
      <div className="space-y-0.5 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground leading-snug">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

interface TemplatePickerCardProps {
  tmpl: (typeof CV_TEMPLATES)[number];
  active: boolean;
  onSelect: () => void;
}

export function TemplatePickerCard({ tmpl, active, onSelect }: TemplatePickerCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group w-full text-left rounded-lg border p-3 transition-all',
        active
          ? 'border-brand ring-2 ring-brand/40 bg-brand-muted/40'
          : 'border-border hover:border-brand/40 hover:bg-muted/40',
      )}
      aria-pressed={active}
    >
      <TemplateThumb id={tmpl.id as CVTemplateId} />
      <p className="text-sm font-semibold mt-2">{tmpl.name}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
        {tmpl.blurb}
      </p>
    </button>
  );
}

/**
 * Pure-CSS schematic of each template — block + lines that hint at the
 * layout without screenshotting the real preview. Theme-token-free so it
 * never drifts.
 */
export function TemplateThumb({ id }: { id: CVTemplateId }) {
  if (id === "modern") {
    return (
      <div className="aspect-[3/4] w-full rounded border border-border overflow-hidden bg-white">
        <div className="h-1/4 bg-blue-700 flex items-center px-2 gap-1.5">
          <span className="block h-3 w-3 rounded-full bg-white/70" />
          <span className="block h-1.5 w-10 rounded-sm bg-white/80" />
        </div>
        <div className="grid grid-cols-[1fr_2fr] gap-1.5 p-2">
          <div className="space-y-1">
            <span className="block h-1 w-full bg-blue-100 rounded-sm" />
            <span className="block h-1 w-3/4 bg-neutral-200 rounded-sm" />
            <span className="block h-1 w-2/3 bg-neutral-200 rounded-sm" />
            <span className="mt-1 block h-1 w-full bg-blue-100 rounded-sm" />
            <span className="block h-1 w-3/4 bg-neutral-200 rounded-sm" />
          </div>
          <div className="space-y-1">
            <span className="block h-1.5 w-1/2 bg-neutral-800 rounded-sm" />
            <span className="block h-1 w-full bg-neutral-200 rounded-sm" />
            <span className="block h-1 w-5/6 bg-neutral-200 rounded-sm" />
            <span className="block h-1 w-3/4 bg-neutral-200 rounded-sm" />
          </div>
        </div>
      </div>
    );
  }
  if (id === "minimal") {
    return (
      <div className="aspect-[3/4] w-full rounded border border-border overflow-hidden bg-white p-2 space-y-1.5">
        <div className="text-center space-y-1">
          <span className="mx-auto block h-1.5 w-2/3 bg-neutral-900 rounded-sm" />
          <span className="mx-auto block h-1 w-1/2 bg-neutral-400 rounded-sm" />
        </div>
        <div className="border-t border-neutral-300 pt-1 space-y-1">
          <span className="block h-1 w-1/3 bg-neutral-900 rounded-sm" />
          <span className="block h-1 w-full bg-neutral-200 rounded-sm" />
          <span className="block h-1 w-5/6 bg-neutral-200 rounded-sm" />
        </div>
        <div className="border-t border-neutral-300 pt-1 space-y-1">
          <span className="block h-1 w-1/3 bg-neutral-900 rounded-sm" />
          <span className="block h-1 w-full bg-neutral-200 rounded-sm" />
          <span className="block h-1 w-3/4 bg-neutral-200 rounded-sm" />
        </div>
      </div>
    );
  }
  return (
    <div className="aspect-[3/4] w-full rounded border border-border overflow-hidden bg-white p-2">
      <div className="flex gap-2 border-b-2 border-emerald-800 pb-1.5">
        <span className="block h-9 w-7 rounded-sm bg-neutral-200" />
        <div className="flex-1 space-y-1 pt-0.5">
          <span className="block h-1.5 w-2/3 bg-emerald-800 rounded-sm" />
          <span className="block h-1 w-1/2 bg-neutral-400 rounded-sm" />
          <span className="block h-1 w-3/4 bg-neutral-200 rounded-sm" />
        </div>
      </div>
      <div className="mt-1.5 space-y-1">
        <span className="block h-1 w-1/3 bg-emerald-800 rounded-sm" />
        <span className="block h-1 w-full bg-neutral-200 rounded-sm" />
        <span className="block h-1 w-5/6 bg-neutral-200 rounded-sm" />
        <span className="mt-1 block h-1 w-1/3 bg-emerald-800 rounded-sm" />
        <span className="block h-1 w-full bg-neutral-200 rounded-sm" />
      </div>
    </div>
  );
}
