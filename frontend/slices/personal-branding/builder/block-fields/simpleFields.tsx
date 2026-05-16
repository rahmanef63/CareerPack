"use client";

import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import type { Block } from "../../blocks/types";
import type { UpdateFn } from "./types";

interface FieldProps {
  block: Block;
  update: UpdateFn;
}

export function HeadingFields({ block, update }: FieldProps) {
  const p = block.payload as { text?: string; size?: string };
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor={`bf-heading-text-${block.id}`}>Teks judul</Label>
        <Input
          id={`bf-heading-text-${block.id}`}
          value={p.text ?? ""}
          maxLength={120}
          onChange={(e) => update("text", e.target.value)}
          placeholder="Tentang Saya"
        />
      </div>
      <div className="space-y-1">
        <Label>Ukuran</Label>
        <ResponsiveSelect
          value={p.size ?? "lg"}
          onValueChange={(v) => update("size", v)}
        >
          <ResponsiveSelectTrigger />
          <ResponsiveSelectContent drawerTitle="Ukuran heading">
            <ResponsiveSelectItem value="lg">Besar</ResponsiveSelectItem>
            <ResponsiveSelectItem value="md">Sedang</ResponsiveSelectItem>
          </ResponsiveSelectContent>
        </ResponsiveSelect>
      </div>
    </div>
  );
}

export function ParagraphFields({ block, update }: FieldProps) {
  const p = block.payload as { text?: string };
  return (
    <div className="space-y-1">
      <Label htmlFor={`bf-p-text-${block.id}`}>Teks</Label>
      <Textarea
        id={`bf-p-text-${block.id}`}
        value={p.text ?? ""}
        maxLength={2000}
        rows={6}
        onChange={(e) => update("text", e.target.value)}
        placeholder="Dukung **bold**, _italic_, [tautan](https://…)."
      />
      <p className="text-xs text-muted-foreground">
        Markdown ringan: <code>**bold**</code> <code>_italic_</code>{" "}
        <code>[label](url)</code>. Baris baru → enter.
      </p>
    </div>
  );
}

export function DividerFields({ block, update }: FieldProps) {
  const p = block.payload as { style?: string };
  return (
    <div className="space-y-1">
      <Label>Gaya</Label>
      <ResponsiveSelect
        value={p.style ?? "line"}
        onValueChange={(v) => update("style", v)}
      >
        <ResponsiveSelectTrigger />
        <ResponsiveSelectContent drawerTitle="Gaya divider">
          <ResponsiveSelectItem value="line">Garis</ResponsiveSelectItem>
          <ResponsiveSelectItem value="dot">Tiga titik</ResponsiveSelectItem>
        </ResponsiveSelectContent>
      </ResponsiveSelect>
    </div>
  );
}

export function HtmlFields({ block, update }: FieldProps) {
  const p = block.payload as { content?: string };
  return (
    <div className="space-y-1">
      <Label htmlFor={`bf-html-content-${block.id}`}>HTML</Label>
      <Textarea
        id={`bf-html-content-${block.id}`}
        value={p.content ?? ""}
        maxLength={5000}
        rows={10}
        onChange={(e) => update("content", e.target.value)}
        placeholder="<h2>Tentang</h2><p>Halo, saya …</p>"
        className="font-mono text-xs"
      />
      <p className="text-xs text-muted-foreground">
        Disanitasi server: hanya tag aman (p, br, strong, em, a, ul, ol, li,
        code, pre, blockquote, h2-h4). Tag <code>&lt;script&gt;</code>,{" "}
        <code>&lt;iframe&gt;</code>, <code>on*=</code> handler dan protokol
        <code> javascript:</code> otomatis dihapus.
      </p>
    </div>
  );
}
