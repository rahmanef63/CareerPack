"use client";

import { useState } from "react";
import {
  Heading,
  Type,
  Link as LinkIcon,
  Share2,
  ImageIcon,
  Film,
  Minus,
  Code2,
  Plus,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Button } from "@/shared/components/ui/button";
import type { BlockType } from "../blocks/types";

interface Item {
  type: BlockType;
  label: string;
  icon: typeof Heading;
  description: string;
}

export const BLOCK_LIBRARY: ReadonlyArray<Item> = [
  { type: "heading", label: "Judul", icon: Heading, description: "Penanda bagian besar" },
  { type: "paragraph", label: "Paragraf", icon: Type, description: "Teks bebas (dukung **bold** _italic_ [link](url))" },
  { type: "link", label: "Tautan / Tombol", icon: LinkIcon, description: "Tombol besar ke URL — Linktree-style" },
  { type: "social", label: "Sosial", icon: Share2, description: "Baris ikon medsos (LinkedIn, IG, X, dst)" },
  { type: "image", label: "Gambar", icon: ImageIcon, description: "Foto / banner dengan caption opsional" },
  { type: "embed", label: "Embed", icon: Film, description: "YouTube / Vimeo / Spotify / SoundCloud" },
  { type: "divider", label: "Pemisah", icon: Minus, description: "Garis atau titik untuk memberi napas" },
  { type: "html", label: "HTML / Rich", icon: Code2, description: "HTML lanjutan — sudah disanitasi" },
];

export function AddBlockMenu({ onPick }: { onPick: (type: BlockType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full gap-2 border-dashed">
          <Plus className="h-4 w-4" />
          Tambah Blok
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-[min(20rem,calc(100vw-2rem))] p-2"
      >
        <div className="grid gap-1">
          {BLOCK_LIBRARY.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => {
                  onPick(item.type);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent focus:bg-accent focus:outline-none"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-muted text-brand-muted-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
