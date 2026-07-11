"use client";

import { Briefcase } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { FIELD_LIMITS_PB } from "../form/defaults";
import type { Bind } from "../form/types";

export interface AvailabilityCardProps {
  bind: Bind;
}

/**
 * Availability badge card — renders a green "Open for work" pill near
 * the public-page hero when toggled on. Note is short-form (≤80 chars)
 * for context like "Senior frontend, remote, Q3 2026".
 */
export function AvailabilityCard({ bind }: AvailabilityCardProps) {
  const open = bind("availableForHire");
  const note = bind("availabilityNote");
  const noteLen = note.value.length;
  const noteOver = noteLen > FIELD_LIMITS_PB.availabilityNoteMax;

  const noteFields = open.value && (
    <div className="space-y-2">
      <Label
        htmlFor="pb-availability-note"
        className="text-xs text-muted-foreground"
      >
        Catatan singkat (opsional)
      </Label>
      <Input
        id="pb-availability-note"
        value={note.value}
        onChange={(e) => note.onChange(e.target.value)}
        placeholder="Senior Frontend · Remote · Mulai Juli 2026"
        maxLength={FIELD_LIMITS_PB.availabilityNoteMax}
        aria-describedby="pb-availability-note-help"
      />
      <p
        id="pb-availability-note-help"
        className={`text-[10px] ${noteOver ? "text-rose-600" : "text-muted-foreground"}`}
      >
        {noteLen}/{FIELD_LIMITS_PB.availabilityNoteMax} — role, lokasi,
        atau kapan available. Singkat & spesifik.
      </p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-emerald-50/40 p-3 sm:flex-row sm:items-start sm:justify-between dark:bg-emerald-950/20">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Briefcase className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Aktifkan badge tersedia
          </p>
          <p className="text-xs text-muted-foreground">
            Recruiter skim halaman pertama-tama untuk memastikan Anda
            available.
          </p>
        </div>
        <Switch
          checked={open.value}
          onCheckedChange={(v) => open.onChange(Boolean(v))}
          aria-label="Aktifkan badge tersedia"
        />
      </div>
      {noteFields}
    </div>
  );
}
