"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Label } from "@/shared/components/ui/label";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { cn } from "@/shared/lib/utils";
import type { BlockStyle } from "../../blocks/types";

interface Props {
  style?: BlockStyle;
  onChange: (next: BlockStyle | undefined) => void;
}

export function StyleChromeFields({ style, onChange }: Props) {
  const [open, setOpen] = useState(
    () => Boolean(style && Object.keys(style).length > 0),
  );
  const bg = style?.bgVariant ?? "none";
  const pad = style?.padding ?? "none";
  const ta = style?.textAlign ?? "start";

  function patch(next: Partial<BlockStyle>) {
    const merged: BlockStyle = { ...(style ?? {}), ...next };
    if (merged.bgVariant === "none") delete merged.bgVariant;
    if (merged.padding === "none") delete merged.padding;
    if (merged.textAlign === "start") delete merged.textAlign;
    onChange(Object.keys(merged).length === 0 ? undefined : merged);
  }

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      className="rounded-md border border-border bg-muted/20"
    >
      <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40">
        <span>Tampilan blok (background, padding, alignment)</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open && "rotate-180",
          )}
        />
      </summary>
      <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">Background</Label>
          <ResponsiveSelect
            value={bg}
            onValueChange={(v) => patch({ bgVariant: v as BlockStyle["bgVariant"] })}
          >
            <ResponsiveSelectTrigger />
            <ResponsiveSelectContent drawerTitle="Background blok">
              <ResponsiveSelectItem value="none">— Tidak ada</ResponsiveSelectItem>
              <ResponsiveSelectItem value="card">Kartu</ResponsiveSelectItem>
              <ResponsiveSelectItem value="muted">Muted</ResponsiveSelectItem>
              <ResponsiveSelectItem value="primary-soft">Primary (soft)</ResponsiveSelectItem>
              <ResponsiveSelectItem value="border">Border saja</ResponsiveSelectItem>
            </ResponsiveSelectContent>
          </ResponsiveSelect>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Padding</Label>
          <ResponsiveSelect
            value={pad}
            onValueChange={(v) => patch({ padding: v as BlockStyle["padding"] })}
          >
            <ResponsiveSelectTrigger />
            <ResponsiveSelectContent drawerTitle="Padding blok">
              <ResponsiveSelectItem value="none">— Tidak ada</ResponsiveSelectItem>
              <ResponsiveSelectItem value="sm">Kecil</ResponsiveSelectItem>
              <ResponsiveSelectItem value="md">Sedang</ResponsiveSelectItem>
              <ResponsiveSelectItem value="lg">Besar</ResponsiveSelectItem>
            </ResponsiveSelectContent>
          </ResponsiveSelect>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Alignment teks</Label>
          <ResponsiveSelect
            value={ta}
            onValueChange={(v) => patch({ textAlign: v as BlockStyle["textAlign"] })}
          >
            <ResponsiveSelectTrigger />
            <ResponsiveSelectContent drawerTitle="Alignment teks">
              <ResponsiveSelectItem value="start">Kiri</ResponsiveSelectItem>
              <ResponsiveSelectItem value="center">Tengah</ResponsiveSelectItem>
              <ResponsiveSelectItem value="end">Kanan</ResponsiveSelectItem>
            </ResponsiveSelectContent>
          </ResponsiveSelect>
        </div>
      </div>
    </details>
  );
}
