"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { Block, BlockType } from "../blocks/types";
import { AddBlockMenu } from "../builder/AddBlockMenu";
import { BlockList } from "../builder/BlockList";
import type { Bind, SectionOverrides } from "../form/types";

function newId() {
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultPayload(type: BlockType): Record<string, unknown> {
  switch (type) {
    case "heading":
      return { text: "Bagian Baru", size: "lg" };
    case "paragraph":
      return { text: "" };
    case "link":
      return { label: "Label tombol", url: "https://", variant: "primary" };
    case "social":
      return { items: [{ platform: "linkedin", url: "" }] };
    case "image":
      return { url: "https://", alt: "" };
    case "embed":
      return { url: "" };
    case "divider":
      return { style: "line" };
    case "html":
      return { content: "<p>Halo, …</p>" };
  }
}

export interface ManualBlocksCardProps extends SectionOverrides {
  bind: Bind;
}

/**
 * Block authoring shell — list (sortable, inline-editable) + add menu.
 * BlockList handles drag-drop, hide/show, delete, and inline expand
 * editing; this component owns only the "create new" flow.
 */
export function ManualBlocksCard({
  bind,
  title = "Blok halaman",
  description = "Drag untuk geser. Klik chevron untuk edit di tempat. Sembunyikan tanpa hapus pakai ikon mata.",
  className,
}: ManualBlocksCardProps) {
  const blocks = bind("blocks");

  const handleAdd = (type: BlockType) => {
    const id = newId();
    const block = {
      id,
      type,
      payload: defaultPayload(type),
    } as unknown as Block;
    blocks.onChange([...blocks.value, block]);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <BlockList blocks={blocks.value} onChange={blocks.onChange} />
        <AddBlockMenu onPick={handleAdd} />
      </CardContent>
    </Card>
  );
}
