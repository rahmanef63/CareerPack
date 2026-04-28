"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import {
  type Block,
  SOCIAL_PLATFORMS,
  parseEmbedUrl,
} from "../blocks/types";

export interface BlockFieldsProps {
  block: Block;
  onChange: (next: Block) => void;
}

/**
 * Per-type form rows for a single block. Used inline inside the
 * sortable BlockList — clicking the chevron on a row expands this
 * editor underneath. The block-type variety is small, so each branch
 * is intentionally inline here.
 *
 * The branches are intentionally inline. Block-type variety is small
 * and keeping every shape in one file makes the contract obvious.
 */
export function BlockFields({ block, onChange }: BlockFieldsProps) {
  const update = (key: string, value: unknown) => {
    onChange({
      ...block,
      payload: { ...(block.payload as object), [key]: value },
    } as Block);
  };

  switch (block.type) {
    case "heading": {
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
    case "paragraph": {
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
    case "link": {
      const p = block.payload as {
        label?: string;
        url?: string;
        description?: string;
        emoji?: string;
        variant?: string;
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
            <Label htmlFor={`bf-link-desc-${block.id}`}>
              Deskripsi (opsional)
            </Label>
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
                <ResponsiveSelectItem value="primary">
                  Primary (gradient)
                </ResponsiveSelectItem>
                <ResponsiveSelectItem value="secondary">
                  Secondary (outline)
                </ResponsiveSelectItem>
                <ResponsiveSelectItem value="ghost">
                  Ghost (dashed)
                </ResponsiveSelectItem>
              </ResponsiveSelectContent>
            </ResponsiveSelect>
          </div>
        </div>
      );
    }
    case "social": {
      const p = block.payload as {
        items?: Array<{ platform: string; url: string }>;
      };
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
    case "image": {
      const p = block.payload as {
        url?: string;
        alt?: string;
        caption?: string;
        link?: string;
      };
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor={`bf-img-url-${block.id}`}>URL gambar</Label>
            <Input
              id={`bf-img-url-${block.id}`}
              type="url"
              value={p.url ?? ""}
              onChange={(e) => update("url", e.target.value)}
              placeholder="https://…/banner.jpg"
              inputMode="url"
            />
            <p className="text-xs text-muted-foreground">
              Tip: unggah dulu ke layanan host gambar (Imgur, Cloudinary, dll)
              lalu paste URL-nya.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`bf-img-alt-${block.id}`}>Alt text</Label>
            <Input
              id={`bf-img-alt-${block.id}`}
              value={p.alt ?? ""}
              maxLength={200}
              onChange={(e) => update("alt", e.target.value)}
              placeholder="Deskripsi singkat untuk pembaca layar"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`bf-img-caption-${block.id}`}>
              Caption (opsional)
            </Label>
            <Input
              id={`bf-img-caption-${block.id}`}
              value={p.caption ?? ""}
              maxLength={200}
              onChange={(e) => update("caption", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`bf-img-link-${block.id}`}>
              Tautkan ke URL (opsional)
            </Label>
            <Input
              id={`bf-img-link-${block.id}`}
              type="url"
              value={p.link ?? ""}
              onChange={(e) => update("link", e.target.value)}
              placeholder="https://…"
              inputMode="url"
            />
          </div>
        </div>
      );
    }
    case "embed": {
      const p = block.payload as {
        url?: string;
        provider?: string;
        id?: string;
        caption?: string;
      };
      const preview = p.url ? parseEmbedUrl(p.url) : null;
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor={`bf-embed-url-${block.id}`}>URL</Label>
            <Input
              id={`bf-embed-url-${block.id}`}
              type="url"
              value={p.url ?? ""}
              onChange={(e) => update("url", e.target.value)}
              placeholder="https://youtu.be/… atau open.spotify.com/track/…"
              inputMode="url"
            />
            <p className="text-xs text-muted-foreground">
              Didukung: YouTube, Vimeo, Spotify, SoundCloud. URL otomatis
              dinormalisasi ke ID — server tidak menerima iframe code.
            </p>
            {p.url && !preview && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                URL belum terdeteksi. Pastikan dari salah satu platform di atas.
              </p>
            )}
            {preview && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Terdeteksi: {preview.provider} · {preview.id}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor={`bf-embed-caption-${block.id}`}>
              Caption (opsional)
            </Label>
            <Input
              id={`bf-embed-caption-${block.id}`}
              value={p.caption ?? ""}
              maxLength={200}
              onChange={(e) => update("caption", e.target.value)}
            />
          </div>
        </div>
      );
    }
    case "divider": {
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
    case "html": {
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
  }
}
