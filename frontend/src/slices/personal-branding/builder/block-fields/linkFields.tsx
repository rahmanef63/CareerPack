"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { type Block, SOCIAL_PLATFORMS } from "../../blocks/types";
import type { UpdateFn } from "./types";

interface FieldProps {
  block: Block;
  update: UpdateFn;
}

export function LinkFields({ block, update }: FieldProps) {
  const p = block.payload as {
    label?: string; url?: string; description?: string;
    emoji?: string; variant?: string;
  };
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_5rem]">
        <div className="space-y-1">
          <Label htmlFor={`bf-link-label-${block.id}`}>Label</Label>
          <Input
            id={`bf-link-label-${block.id}`}
            value={p.label ?? ""}
            maxLength={80}
            onChange={(e) => update("label", e.target.value)}
            placeholder="Lihat Portofolio"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`bf-link-emoji-${block.id}`}>Emoji</Label>
          <Input
            id={`bf-link-emoji-${block.id}`}
            value={p.emoji ?? ""}
            maxLength={4}
            onChange={(e) => update("emoji", e.target.value)}
            placeholder="🎨"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`bf-link-url-${block.id}`}>URL</Label>
        <Input
          id={`bf-link-url-${block.id}`}
          type="url"
          value={p.url ?? ""}
          onChange={(e) => update("url", e.target.value)}
          placeholder="https://…"
          inputMode="url"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`bf-link-desc-${block.id}`}>Deskripsi (opsional)</Label>
        <Input
          id={`bf-link-desc-${block.id}`}
          value={p.description ?? ""}
          maxLength={160}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Subteks kecil di bawah label"
        />
      </div>
      <div className="space-y-1">
        <Label>Variasi</Label>
        <ResponsiveSelect
          value={p.variant ?? "primary"}
          onValueChange={(v) => update("variant", v)}
        >
          <ResponsiveSelectTrigger />
          <ResponsiveSelectContent drawerTitle="Variasi tombol">
            <ResponsiveSelectItem value="primary">Primary (gradient)</ResponsiveSelectItem>
            <ResponsiveSelectItem value="secondary">Secondary (outline)</ResponsiveSelectItem>
            <ResponsiveSelectItem value="ghost">Ghost (dashed)</ResponsiveSelectItem>
          </ResponsiveSelectContent>
        </ResponsiveSelect>
      </div>
    </div>
  );
}

export function SocialFields({ block, update }: FieldProps) {
  const p = block.payload as { items?: Array<{ platform: string; url: string }> };
  const items = p.items ?? [];
  return (
    <div className="space-y-2">
      <Label>Akun sosial</Label>
      {items.map((it, i) => (
        <div
          key={i}
          className="grid gap-2 rounded-md border border-border p-2 sm:grid-cols-[8rem_1fr_auto]"
        >
          <ResponsiveSelect
            value={it.platform}
            onValueChange={(v) => {
              const next = items.slice();
              next[i] = { ...next[i], platform: v };
              update("items", next);
            }}
          >
            <ResponsiveSelectTrigger placeholder="Platform" />
            <ResponsiveSelectContent drawerTitle="Platform sosial">
              {SOCIAL_PLATFORMS.map((s) => (
                <ResponsiveSelectItem key={s} value={s}>
                  {s}
                </ResponsiveSelectItem>
              ))}
            </ResponsiveSelectContent>
          </ResponsiveSelect>
          <Input
            value={it.url}
            placeholder="https://…"
            onChange={(e) => {
              const next = items.slice();
              next[i] = { ...next[i], url: e.target.value };
              update("items", next);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              const next = items.slice();
              next.splice(i, 1);
              update("items", next);
            }}
            aria-label="Hapus baris"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          update("items", [...items, { platform: "linkedin", url: "" }]);
        }}
      >
        + Tambah platform
      </Button>
    </div>
  );
}
