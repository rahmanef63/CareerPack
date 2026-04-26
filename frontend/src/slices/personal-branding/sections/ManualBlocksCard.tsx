"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { Block, BlockType } from "../blocks/types";
import { AddBlockMenu } from "../builder/AddBlockMenu";
import { BlockEditor } from "../builder/BlockEditor";
import { BlockList } from "../builder/BlockList";
import type { Bind, SectionOverrides } from "../form/types";

function newId() {
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultPayload(type: BlockType): Record<string, unknown> {
  switch (type) {
    case "heading": return { text: "Bagian Baru", size: "lg" };
    case "paragraph": return { text: "" };
    case "link": return { label: "Label tombol", url: "https://", variant: "primary" };
    case "social": return { items: [{ platform: "linkedin", url: "" }] };
    case "image": return { url: "https://", alt: "" };
    case "embed": return { url: "" };
    case "divider": return { style: "line" };
    case "html": return { content: "<p>Halo, …</p>" };
  }
}

export interface ManualBlocksCardProps extends SectionOverrides {
  bind: Bind;
}

/**
 * Block authoring layer — list + add menu + editor dialog.
 * Encapsulated so the View doesn't need to know about editor state.
 */
export function ManualBlocksCard({
  bind,
  title = "Blok halaman",
  description = "Susun konten dari atas ke bawah. Tiap blok bisa diedit, disembunyikan, dipindahkan, atau dihapus.",
  className,
}: ManualBlocksCardProps) {
  const blocks = bind("blocks");
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing =
    editingId === null
      ? null
      : blocks.value.find((b) => b.id === editingId) ?? null;

  const handleAdd = (type: BlockType) => {
    const id = newId();
    const block = {
      id,
      type,
      payload: defaultPayload(type),
    } as unknown as Block;
    blocks.onChange([...blocks.value, block]);
    setEditingId(id);
  };
  const handleSaveBlock = (b: Block) => {
    blocks.onChange(blocks.value.map((x) => (x.id === b.id ? b : x)));
  };
  const handleDeleteBlock = (id: string) => {
    blocks.onChange(blocks.value.filter((b) => b.id !== id));
  };
  const handleMove = (id: string, dir: "up" | "down") => {
    const i = blocks.value.findIndex((b) => b.id === id);
    if (i < 0) return;
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= blocks.value.length) return;
    const next = blocks.value.slice();
    [next[i], next[j]] = [next[j], next[i]];
    blocks.onChange(next);
  };
  const handleToggleHidden = (id: string) => {
    blocks.onChange(
      blocks.value.map((b) =>
        b.id === id ? { ...b, hidden: !b.hidden } : b,
      ),
    );
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <BlockList
            blocks={blocks.value}
            onEdit={(id) => setEditingId(id)}
            onMove={handleMove}
            onToggleHidden={handleToggleHidden}
          />
          <AddBlockMenu onPick={handleAdd} />
        </CardContent>
      </Card>

      <BlockEditor
        open={editing !== null}
        block={editing}
        onClose={() => setEditingId(null)}
        onSave={handleSaveBlock}
        onDelete={handleDeleteBlock}
      />
    </>
  );
}
