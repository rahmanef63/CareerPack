"use client";

import {
  Heading,
  Type,
  Link as LinkIcon,
  Share2,
  ImageIcon,
  Film,
  Minus,
  Code2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Pencil,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type { Block, BlockType } from "../blocks/types";

const ICONS: Record<BlockType, typeof Heading> = {
  heading: Heading,
  paragraph: Type,
  link: LinkIcon,
  social: Share2,
  image: ImageIcon,
  embed: Film,
  divider: Minus,
  html: Code2,
};

const TYPE_LABELS: Record<BlockType, string> = {
  heading: "Judul",
  paragraph: "Paragraf",
  link: "Tautan",
  social: "Sosial",
  image: "Gambar",
  embed: "Embed",
  divider: "Pemisah",
  html: "HTML",
};

interface Props {
  blocks: Block[];
  onEdit: (id: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onToggleHidden: (id: string) => void;
}

export function BlockList({ blocks, onEdit, onMove, onToggleHidden }: Props) {
  if (blocks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
        <p className="text-sm font-medium text-foreground">Belum ada blok</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Klik &ldquo;Tambah Blok&rdquo; untuk mulai. Combo populer: Sosial +
          beberapa Tautan + 1 Embed.
        </p>
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {blocks.map((b, i) => {
        const Icon = ICONS[b.type];
        const isFirst = i === 0;
        const isLast = i === blocks.length - 1;
        return (
          <li
            key={b.id}
            className={cn(
              "flex flex-col gap-2 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center",
              b.hidden && "opacity-55",
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-muted text-brand-muted-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {TYPE_LABELS[b.type]}
                  {b.hidden && (
                    <span className="ml-2 text-[10px] text-amber-600 dark:text-amber-400">
                      disembunyikan
                    </span>
                  )}
                </p>
                <p className="truncate text-sm text-foreground">{summary(b)}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isFirst}
                onClick={() => onMove(b.id, "up")}
                aria-label="Naikkan"
                className="h-8 w-8"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isLast}
                onClick={() => onMove(b.id, "down")}
                aria-label="Turunkan"
                className="h-8 w-8"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onToggleHidden(b.id)}
                aria-label={b.hidden ? "Tampilkan" : "Sembunyikan"}
                className="h-8 w-8"
              >
                {b.hidden ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onEdit(b.id)}
                aria-label="Edit"
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function summary(b: Block): string {
  const p = b.payload as Record<string, unknown>;
  switch (b.type) {
    case "heading":
    case "paragraph":
      return ((p.text as string) ?? "").slice(0, 80) || "(kosong)";
    case "link":
      return `${(p.label as string) ?? ""} → ${(p.url as string) ?? ""}`;
    case "social": {
      const items = (p.items as Array<{ platform: string }>) ?? [];
      return items.length
        ? `${items.length} platform: ${items.map((i) => i.platform).join(", ")}`
        : "Belum ada platform";
    }
    case "image":
      return ((p.alt as string) || (p.url as string)) ?? "Gambar";
    case "embed":
      return `${(p.provider as string) ?? "?"} · ${(p.id as string) ?? "?"}`;
    case "divider":
      return p.style === "dot" ? "Tiga titik" : "Garis";
    case "html":
      return ((p.content as string) ?? "")
        .replace(/<[^>]+>/g, "")
        .slice(0, 80) || "HTML kosong";
  }
}
