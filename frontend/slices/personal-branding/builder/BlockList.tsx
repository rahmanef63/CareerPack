"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  Code2,
  Columns3,
  Eye,
  EyeOff,
  Film,
  GripVertical,
  Heading,
  ImageIcon,
  Link as LinkIcon,
  Minus,
  Share2,
  Trash2,
  Type,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type { Block, BlockType } from "../blocks/types";
import { BlockFields } from "./BlockFields";

const ICONS: Record<BlockType, typeof Heading> = {
  heading: Heading,
  paragraph: Type,
  link: LinkIcon,
  social: Share2,
  image: ImageIcon,
  embed: Film,
  divider: Minus,
  html: Code2,
  container: Columns3,
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
  container: "Container",
};

interface Props {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

/**
 * Sortable block list with inline editor. Replaces the old up/down-
 * button + modal-editor pattern: drag handle reorders via @dnd-kit
 * (PointerSensor + TouchSensor + KeyboardSensor for full a11y), and
 * the chevron toggles an inline BlockFields editor underneath each
 * row. Modal is gone.
 */
export function BlockList({ blocks, onChange }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = blocks.findIndex((b) => b.id === active.id);
    const newIdx = blocks.findIndex((b) => b.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    onChange(arrayMove(blocks, oldIdx, newIdx));
  }

  function updateBlock(next: Block) {
    onChange(blocks.map((b) => (b.id === next.id ? next : b)));
  }
  function deleteBlock(id: string) {
    onChange(blocks.filter((b) => b.id !== id));
    if (expandedId === id) setExpandedId(null);
  }
  function toggleHidden(id: string) {
    onChange(
      blocks.map((b) => (b.id === id ? { ...b, hidden: !b.hidden } : b)),
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
        <p className="text-sm font-medium text-foreground">Belum ada blok</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pakai tab <strong>Preset Blok</strong> untuk insert section
          pre-built, atau klik &ldquo;Tambah Blok&rdquo; untuk pilih primitif.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-2">
          {blocks.map((block) => (
            <SortableBlockItem
              key={block.id}
              block={block}
              expanded={expandedId === block.id}
              onToggleExpand={() =>
                setExpandedId(expandedId === block.id ? null : block.id)
              }
              onUpdate={updateBlock}
              onToggleHidden={() => toggleHidden(block.id)}
              onDelete={() => deleteBlock(block.id)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

interface ItemProps {
  block: Block;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (next: Block) => void;
  onToggleHidden: () => void;
  onDelete: () => void;
}

function SortableBlockItem({
  block,
  expanded,
  onToggleExpand,
  onUpdate,
  onToggleHidden,
  onDelete,
}: ItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });
  const Icon = ICONS[block.type];
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-border bg-card transition-shadow",
        isDragging && "z-10 shadow-lg ring-2 ring-brand",
        block.hidden && "opacity-55",
      )}
    >
      <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground hover:bg-muted active:cursor-grabbing"
            aria-label="Drag untuk pindah"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-muted text-brand-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {TYPE_LABELS[block.type]}
              {block.hidden && (
                <span className="ml-2 text-[10px] text-amber-600 dark:text-amber-400">
                  disembunyikan
                </span>
              )}
            </p>
            <p className="truncate text-sm text-foreground">{summary(block)}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleHidden}
            aria-label={block.hidden ? "Tampilkan" : "Sembunyikan"}
            className="h-8 w-8"
          >
            {block.hidden ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label="Hapus"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={expanded ? "default" : "outline"}
            size="icon"
            onClick={onToggleExpand}
            aria-label={expanded ? "Tutup edit" : "Buka edit"}
            aria-expanded={expanded}
            className="h-8 w-8"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="space-y-3 border-t border-border bg-muted/20 p-3">
          <BlockFields block={block} onChange={onUpdate} />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
            >
              Selesai edit
            </Button>
          </div>
        </div>
      )}
    </li>
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
      return (
        ((p.content as string) ?? "").replace(/<[^>]+>/g, "").slice(0, 80) ||
        "HTML kosong"
      );
    case "container": {
      const layout = (p.layout as string) ?? "row";
      const children = (p.children as Array<unknown>) ?? [];
      const layoutLabel =
        layout === "stack" ? "Stack"
          : layout === "row" ? "Baris"
          : layout === "grid-2" ? "Grid 2"
          : layout === "grid-3" ? "Grid 3"
          : layout === "grid-4" ? "Grid 4"
          : layout === "carousel" ? "Carousel"
          : layout;
      return `${layoutLabel} · ${children.length} blok`;
    }
  }
}
