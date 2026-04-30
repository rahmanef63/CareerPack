"use client";

import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { type Block, parseEmbedUrl } from "../../blocks/types";
import type { UpdateFn } from "./types";

interface FieldProps {
  block: Block;
  update: UpdateFn;
}

export function ImageFields({ block, update }: FieldProps) {
  const p = block.payload as {
    url?: string; alt?: string; caption?: string; link?: string;
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
        <Label htmlFor={`bf-img-caption-${block.id}`}>Caption (opsional)</Label>
        <Input
          id={`bf-img-caption-${block.id}`}
          value={p.caption ?? ""}
          maxLength={200}
          onChange={(e) => update("caption", e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`bf-img-link-${block.id}`}>Tautkan ke URL (opsional)</Label>
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

export function EmbedFields({ block, update }: FieldProps) {
  const p = block.payload as {
    url?: string; provider?: string; id?: string; caption?: string;
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
        <Label htmlFor={`bf-embed-caption-${block.id}`}>Caption (opsional)</Label>
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
