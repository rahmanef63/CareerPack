"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import type { PortfolioFormValues } from "../../types";

interface Props {
  values: PortfolioFormValues;
  setValues: React.Dispatch<React.SetStateAction<PortfolioFormValues>>;
}

export function DetailTab({ values, setValues }: Props) {
  return (
    <div className="w-full space-y-3 pt-3">
      <div className="grid grid-cols-2 gap-3">
        <FieldInput
          label="Peran"
          value={values.role}
          placeholder="Lead Designer, Solo Dev…"
          onChange={(s) => setValues((v) => ({ ...v, role: s }))}
        />
        <FieldInput
          label="Klien / Organisasi"
          value={values.client}
          placeholder="Personal, Acme Inc, dll"
          onChange={(s) => setValues((v) => ({ ...v, client: s }))}
        />
      </div>
      <FieldInput
        label="Durasi"
        value={values.duration}
        placeholder="Jan 2024 – Mar 2024 (3 bulan)"
        onChange={(s) => setValues((v) => ({ ...v, duration: s }))}
      />

      <ChipListEditor
        label="Outcome / Metrik"
        hint="e.g. +30% konversi, 10k DAU"
        items={values.outcomes}
        onChange={(outcomes) => setValues((v) => ({ ...v, outcomes }))}
      />
      <ChipListEditor
        label="Tech / Tool"
        hint="React, Figma, Sony A7…"
        items={values.techStack}
        onChange={(techStack) => setValues((v) => ({ ...v, techStack }))}
      />
      <ChipListEditor
        label="Skill"
        hint="UX research, JS, public speaking…"
        items={values.skills}
        onChange={(skills) => setValues((v) => ({ ...v, skills }))}
      />
      <ChipListEditor
        label="Kolaborator"
        hint="Nama orang/tim yang ikut serta"
        items={values.collaborators}
        onChange={(collaborators) => setValues((v) => ({ ...v, collaborators }))}
      />
    </div>
  );
}

function FieldInput({
  label, value, placeholder, onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ChipListEditor({
  label, hint, items, onChange,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (!t || items.includes(t)) return;
    onChange([...items, t]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          placeholder={hint ?? "Tekan Enter"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1 pr-1">
              {t}
              <button
                type="button"
                onClick={() => onChange(items.filter((x) => x !== t))}
                className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                aria-label={`Hapus ${t}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
