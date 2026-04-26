"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from "@/shared/components/ui/responsive-dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  type Block,
  type BlockType,
  SOCIAL_PLATFORMS,
  parseEmbedUrl,
} from "../blocks/types";

interface Props {
  open: boolean;
  block: Block | null;
  onClose: () => void;
  onSave: (block: Block) => void;
  onDelete: (id: string) => void;
}

/**
 * Per-block editor dialog. The form shape switches on `block.type`.
 * Each branch is intentionally inline — block-type variety is small,
 * keeping the cases together makes the contract obvious.
 */
export function BlockEditor({ open, block, onClose, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState<Block | null>(block);

  useEffect(() => {
    setDraft(block);
  }, [block]);

  if (!draft) return null;
  const update = (key: string, value: unknown) => {
    setDraft((d) =>
      d
        ? ({
            ...d,
            payload: { ...(d.payload as object), [key]: value },
          } as Block)
        : d,
    );
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <ResponsiveDialogContent size="2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{titleFor(draft.type)}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Atur isi blok. Klik &ldquo;Simpan&rdquo; untuk menerapkan ke
            halaman publik Anda.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4 py-2">
          <BlockFields draft={draft} update={update} />

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
            <div>
              <p className="text-sm font-medium">Sembunyikan blok ini</p>
              <p className="text-xs text-muted-foreground">
                Blok tetap tersimpan tapi tidak muncul di halaman publik.
              </p>
            </div>
            <Switch
              checked={Boolean(draft.hidden)}
              onCheckedChange={(v) =>
                setDraft((d) => (d ? { ...d, hidden: v } : d))
              }
              aria-label="Sembunyikan blok"
            />
          </div>
        </div>

        <ResponsiveDialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onDelete(draft.id);
              onClose();
            }}
            className="mr-auto gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            Simpan
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function titleFor(t: BlockType): string {
  switch (t) {
    case "heading": return "Edit Judul";
    case "paragraph": return "Edit Paragraf";
    case "link": return "Edit Tautan / Tombol";
    case "social": return "Edit Baris Sosial";
    case "image": return "Edit Gambar";
    case "embed": return "Edit Embed";
    case "divider": return "Edit Pemisah";
    case "html": return "Edit HTML / Rich Text";
  }
}

interface FieldsProps {
  draft: Block;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: (key: any, value: any) => void;
}

function BlockFields({ draft, update }: FieldsProps) {
  switch (draft.type) {
    case "heading": {
      const p = draft.payload as { text?: string; size?: string };
      return (
        <>
          <div className="space-y-1">
            <Label htmlFor="bf-heading-text">Teks judul</Label>
            <Input
              id="bf-heading-text"
              value={p.text ?? ""}
              maxLength={120}
              onChange={(e) => update("text", e.target.value)}
              placeholder="Tentang Saya"
            />
          </div>
          <div className="space-y-1">
            <Label>Ukuran</Label>
            <Select
              value={p.size ?? "lg"}
              onValueChange={(v) => update("size", v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lg">Besar</SelectItem>
                <SelectItem value="md">Sedang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );
    }
    case "paragraph": {
      const p = draft.payload as { text?: string };
      return (
        <div className="space-y-1">
          <Label htmlFor="bf-p-text">Teks</Label>
          <Textarea
            id="bf-p-text"
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
      const p = draft.payload as {
        label?: string;
        url?: string;
        description?: string;
        emoji?: string;
        variant?: string;
      };
      return (
        <>
          <div className="grid gap-3 sm:grid-cols-[1fr_5rem]">
            <div className="space-y-1">
              <Label htmlFor="bf-link-label">Label</Label>
              <Input
                id="bf-link-label"
                value={p.label ?? ""}
                maxLength={80}
                onChange={(e) => update("label", e.target.value)}
                placeholder="Lihat Portofolio"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bf-link-emoji">Emoji</Label>
              <Input
                id="bf-link-emoji"
                value={p.emoji ?? ""}
                maxLength={4}
                onChange={(e) => update("emoji", e.target.value)}
                placeholder="🎨"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="bf-link-url">URL</Label>
            <Input
              id="bf-link-url"
              type="url"
              value={p.url ?? ""}
              onChange={(e) => update("url", e.target.value)}
              placeholder="https://…"
              inputMode="url"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bf-link-desc">Deskripsi (opsional)</Label>
            <Input
              id="bf-link-desc"
              value={p.description ?? ""}
              maxLength={160}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Subteks kecil di bawah label"
            />
          </div>
          <div className="space-y-1">
            <Label>Variasi</Label>
            <Select
              value={p.variant ?? "primary"}
              onValueChange={(v) => update("variant", v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary (gradient)</SelectItem>
                <SelectItem value="secondary">Secondary (outline)</SelectItem>
                <SelectItem value="ghost">Ghost (dashed)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );
    }
    case "social": {
      const p = draft.payload as {
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
              <Select
                value={it.platform}
                onValueChange={(v) => {
                  const next = items.slice();
                  next[i] = { ...next[i], platform: v };
                  update("items", next);
                }}
              >
                <SelectTrigger><SelectValue placeholder="Platform" /></SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORMS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              update("items", [
                ...items,
                { platform: "linkedin", url: "" },
              ]);
            }}
          >
            + Tambah platform
          </Button>
        </div>
      );
    }
    case "image": {
      const p = draft.payload as {
        url?: string;
        alt?: string;
        caption?: string;
        link?: string;
      };
      return (
        <>
          <div className="space-y-1">
            <Label htmlFor="bf-img-url">URL gambar</Label>
            <Input
              id="bf-img-url"
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
            <Label htmlFor="bf-img-alt">Alt text</Label>
            <Input
              id="bf-img-alt"
              value={p.alt ?? ""}
              maxLength={200}
              onChange={(e) => update("alt", e.target.value)}
              placeholder="Deskripsi singkat untuk pembaca layar"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bf-img-caption">Caption (opsional)</Label>
            <Input
              id="bf-img-caption"
              value={p.caption ?? ""}
              maxLength={200}
              onChange={(e) => update("caption", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bf-img-link">Tautkan ke URL (opsional)</Label>
            <Input
              id="bf-img-link"
              type="url"
              value={p.link ?? ""}
              onChange={(e) => update("link", e.target.value)}
              placeholder="https://…"
              inputMode="url"
            />
          </div>
        </>
      );
    }
    case "embed": {
      const p = draft.payload as {
        url?: string;
        provider?: string;
        id?: string;
        caption?: string;
      };
      const preview = p.url ? parseEmbedUrl(p.url) : null;
      return (
        <>
          <div className="space-y-1">
            <Label htmlFor="bf-embed-url">URL</Label>
            <Input
              id="bf-embed-url"
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
            <Label htmlFor="bf-embed-caption">Caption (opsional)</Label>
            <Input
              id="bf-embed-caption"
              value={p.caption ?? ""}
              maxLength={200}
              onChange={(e) => update("caption", e.target.value)}
            />
          </div>
        </>
      );
    }
    case "divider": {
      const p = draft.payload as { style?: string };
      return (
        <div className="space-y-1">
          <Label>Gaya</Label>
          <Select
            value={p.style ?? "line"}
            onValueChange={(v) => update("style", v)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Garis</SelectItem>
              <SelectItem value="dot">Tiga titik</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }
    case "html": {
      const p = draft.payload as { content?: string };
      return (
        <div className="space-y-1">
          <Label htmlFor="bf-html-content">HTML</Label>
          <Textarea
            id="bf-html-content"
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
