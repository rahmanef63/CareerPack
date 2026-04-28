"use client";

import { Plus, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { notify } from "@/shared/lib/notify";
import { BLOCK_PRESETS, type BlockPresetDef } from "./blockPresets";
import type { Block } from "../blocks/types";
import type { Bind } from "../form/types";

function newId(suffix: number): string {
  const r = Math.random().toString(36).slice(2, 8);
  return `b-${Date.now().toString(36)}-${suffix}-${r}`;
}

/**
 * Manual mode "Preset Blok" tab — gallery of pre-configured block
 * clusters. One click appends a curated bundle (Hero, Tentang, Galeri,
 * dll) to `form.blocks`. Each preset uses placeholder copy & URLs
 * realistic enough that the server sanitiser keeps them on save —
 * users edit the actual content via the Konten tab.
 */
export function BlockPresetsCard({ bind }: { bind: Bind }) {
  const blocks = bind("blocks");

  function insertPreset(preset: BlockPresetDef) {
    const additions: Block[] = preset.blocks.map((b, idx) =>
      ({
        id: newId(idx),
        type: b.type,
        payload: b.payload,
        ...(b.hidden ? { hidden: true } : {}),
      } as unknown as Block),
    );
    blocks.onChange([...blocks.value, ...additions]);
    notify.success(`Preset "${preset.label}" ditambahkan`, {
      description: `${additions.length} blok di akhir halaman. Edit di tab Konten.`,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-brand" />
          Preset blok cepat
        </CardTitle>
        <CardDescription>
          Klik preset untuk insert section pre-built — semuanya responsive
          dari sananya. Edit isi tiap blok di tab <strong>Konten</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BLOCK_PRESETS.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => insertPreset(preset)}
                className="group flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3 text-left transition-colors hover:border-brand hover:bg-brand-muted/30 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-muted text-brand-muted-foreground transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <Plus className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-semibold">
                    {preset.label}
                  </p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {preset.description}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground/70">
                  {preset.blocks.length} blok ditambahkan
                </p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
