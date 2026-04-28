"use client";

import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
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
import { cn } from "@/shared/lib/utils";
import {
  type Block,
  type BlockType,
  type BlockStyle,
  SOCIAL_PLATFORMS,
  parseEmbedUrl,
} from "../blocks/types";
import { BLOCK_LIBRARY } from "./AddBlockMenu";
import { makeBlock } from "./blockDefaults";

export interface BlockFieldsProps {
  block: Block;
  onChange: (next: Block) => void;
  /** When true, the per-block style-chrome editor is hidden — used
   *  for container children where the parent container's style is
   *  what matters most. */
  hideStyleChrome?: boolean;
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
export function BlockFields({
  block,
  onChange,
  hideStyleChrome = false,
}: BlockFieldsProps) {
  const update = (key: string, value: unknown) => {
    onChange({
      ...block,
      payload: { ...(block.payload as object), [key]: value },
    } as Block);
  };

  const updateStyle = (next: BlockStyle | undefined) => {
    onChange({ ...block, style: next } as Block);
  };

  const inner = renderTypeFields(block, update);
  const showChrome = !hideStyleChrome && block.type !== "divider";
  return (
    <div className="space-y-4">
      {inner}
      {showChrome && (
        <StyleChromeFields style={block.style} onChange={updateStyle} />
      )}
    </div>
  );
}

function renderTypeFields(
  block: Block,
  update: (key: string, value: unknown) => void,
) {
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
    case "container": {
      const p = block.payload as {
        layout?: string;
        mobileLayout?: string;
        gap?: string;
        align?: string;
        children?: Block[];
      };
      const children = p.children ?? [];
      const setChildren = (next: Block[]) => update("children", next);
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Layout</Label>
              <ResponsiveSelect
                value={p.layout ?? "row"}
                onValueChange={(v) => update("layout", v)}
              >
                <ResponsiveSelectTrigger />
                <ResponsiveSelectContent drawerTitle="Layout container">
                  <ResponsiveSelectItem value="stack">Stack (kolom)</ResponsiveSelectItem>
                  <ResponsiveSelectItem value="row">Baris (auto wrap)</ResponsiveSelectItem>
                  <ResponsiveSelectItem value="grid-2">Grid 2 kolom</ResponsiveSelectItem>
                  <ResponsiveSelectItem value="grid-3">Grid 3 kolom</ResponsiveSelectItem>
                  <ResponsiveSelectItem value="grid-4">Grid 4 kolom</ResponsiveSelectItem>
                  <ResponsiveSelectItem value="carousel">Carousel (geser)</ResponsiveSelectItem>
                </ResponsiveSelectContent>
              </ResponsiveSelect>
            </div>
            <div className="space-y-1">
              <Label>Tampilan mobile</Label>
              <ResponsiveSelect
                value={p.mobileLayout ?? "auto"}
                onValueChange={(v) => update("mobileLayout", v)}
              >
                <ResponsiveSelectTrigger />
                <ResponsiveSelectContent drawerTitle="Tampilan mobile">
                  <ResponsiveSelectItem value="auto">Auto (stack)</ResponsiveSelectItem>
                  <ResponsiveSelectItem value="stack">Selalu stack</ResponsiveSelectItem>
                  <ResponsiveSelectItem value="carousel">Carousel</ResponsiveSelectItem>
                </ResponsiveSelectContent>
              </ResponsiveSelect>
            </div>
            <div className="space-y-1">
              <Label>Jarak antar blok</Label>
              <ResponsiveSelect
                value={p.gap ?? "normal"}
                onValueChange={(v) => update("gap", v)}
              >
                <ResponsiveSelectTrigger />
                <ResponsiveSelectContent drawerTitle="Jarak">
                  <ResponsiveSelectItem value="tight">Rapat</ResponsiveSelectItem>
                  <ResponsiveSelectItem value="normal">Normal</ResponsiveSelectItem>
                  <ResponsiveSelectItem value="loose">Lapang</ResponsiveSelectItem>
                </ResponsiveSelectContent>
              </ResponsiveSelect>
            </div>
            <div className="space-y-1">
              <Label>Alignment</Label>
              <ResponsiveSelect
                value={p.align ?? "stretch"}
                onValueChange={(v) => update("align", v)}
              >
                <ResponsiveSelectTrigger />
                <ResponsiveSelectContent drawerTitle="Alignment">
                  <ResponsiveSelectItem value="stretch">Lebar penuh</ResponsiveSelectItem>
                  <ResponsiveSelectItem value="start">Atas / kiri</ResponsiveSelectItem>
                  <ResponsiveSelectItem value="center">Tengah</ResponsiveSelectItem>
                  <ResponsiveSelectItem value="end">Bawah / kanan</ResponsiveSelectItem>
                </ResponsiveSelectContent>
              </ResponsiveSelect>
            </div>
          </div>
          <ContainerChildrenEditor items={children} onChange={setChildren} />
        </div>
      );
    }
  }
}

interface ContainerChildrenEditorProps {
  items: Block[];
  onChange: (next: Block[]) => void;
}

function ContainerChildrenEditor({
  items: children,
  onChange,
}: ContainerChildrenEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adderOpen, setAdderOpen] = useState(false);

  function updateChild(next: Block) {
    onChange(children.map((c) => (c.id === next.id ? next : c)));
  }
  function deleteChild(id: string) {
    onChange(children.filter((c) => c.id !== id));
    if (expandedId === id) setExpandedId(null);
  }
  function moveChild(id: string, dir: -1 | 1) {
    const idx = children.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= children.length) return;
    const next = children.slice();
    const [it] = next.splice(idx, 1);
    next.splice(target, 0, it);
    onChange(next);
  }
  function addChild(type: BlockType) {
    if (children.length >= 12) return;
    onChange([...children, makeBlock(type)]);
    setAdderOpen(false);
  }

  return (
    <div className="space-y-2 rounded-md border border-dashed border-border bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Isi container ({children.length}/12)
        </p>
      </div>
      {children.length === 0 ? (
        <p className="rounded-md bg-card p-3 text-center text-xs text-muted-foreground">
          Belum ada blok di dalam container.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {children.map((child, idx) => {
            const expanded = expandedId === child.id;
            return (
              <li
                key={child.id}
                className="rounded-md border border-border bg-card"
              >
                <div className="flex items-center gap-2 p-2">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {idx + 1}
                  </span>
                  <span className="flex-1 truncate text-xs font-medium">
                    {childSummary(child)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Naik"
                    disabled={idx === 0}
                    onClick={() => moveChild(child.id, -1)}
                  >
                    <span aria-hidden>↑</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Turun"
                    disabled={idx === children.length - 1}
                    onClick={() => moveChild(child.id, 1)}
                  >
                    <span aria-hidden>↓</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Hapus"
                    onClick={() => deleteChild(child.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant={expanded ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-7"
                    aria-label={expanded ? "Tutup" : "Edit"}
                    onClick={() =>
                      setExpandedId(expanded ? null : child.id)
                    }
                  >
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        expanded && "rotate-180",
                      )}
                    />
                  </Button>
                </div>
                {expanded && (
                  <div className="space-y-2 border-t border-border bg-muted/30 p-2">
                    <BlockFields block={child} onChange={updateChild} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2 border-dashed"
          onClick={() => setAdderOpen((v) => !v)}
          disabled={children.length >= 12}
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah blok ke container
        </Button>
        {adderOpen && (
          <div className="absolute inset-x-0 bottom-full z-20 mb-1 rounded-md border border-border bg-popover p-1 shadow-lg">
            <ul className="grid gap-0.5">
              {BLOCK_LIBRARY.filter((it) => it.type !== "container").map(
                (item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.type}>
                      <button
                        type="button"
                        onClick={() => addChild(item.type)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent"
                      >
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.label}
                      </button>
                    </li>
                  );
                },
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function childSummary(b: Block): string {
  const p = b.payload as Record<string, unknown>;
  switch (b.type) {
    case "heading":
    case "paragraph":
      return ((p.text as string) ?? "").slice(0, 40) || `(${b.type} kosong)`;
    case "link":
      return (p.label as string) || "(Tautan)";
    case "social":
      return `${((p.items as unknown[]) ?? []).length} sosial`;
    case "image":
      return (p.alt as string) || (p.url as string) || "(Gambar)";
    case "embed":
      return `${(p.provider as string) ?? "?"}`;
    case "divider":
      return p.style === "dot" ? "· · ·" : "─";
    case "html":
      return ((p.content as string) ?? "").replace(/<[^>]+>/g, "").slice(0, 40);
    case "container":
      return "(container nested — tidak diizinkan)";
  }
}

interface StyleChromeFieldsProps {
  style?: BlockStyle;
  onChange: (next: BlockStyle | undefined) => void;
}

function StyleChromeFields({ style, onChange }: StyleChromeFieldsProps) {
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
