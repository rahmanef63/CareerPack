"use client";

import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type { Block, BlockType } from "../../blocks/types";
import { BLOCK_LIBRARY } from "../AddBlockMenu";
import { makeBlock } from "../blockDefaults";
import type { BlockFieldsComponent } from "./types";

interface Props {
  items: Block[];
  onChange: (next: Block[]) => void;
  /** Recursive ref so the children editor can render nested BlockFields
   *  without creating an import cycle. */
  BlockFields: BlockFieldsComponent;
}

export function ContainerChildrenEditor({
  items: children,
  onChange,
  BlockFields,
}: Props) {
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
