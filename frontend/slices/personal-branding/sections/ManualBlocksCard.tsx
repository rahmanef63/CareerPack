"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { BlockType } from "../blocks/types";
import { AddBlockMenu } from "../builder/AddBlockMenu";
import { BlockList } from "../builder/BlockList";
import { makeBlock } from "../builder/blockDefaults";
import type { Bind, SectionOverrides } from "../form/types";

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
    blocks.onChange([...blocks.value, makeBlock(type)]);
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
