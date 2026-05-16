"use client";

import { type Block, type BlockStyle } from "../blocks/types";
import { renderTypeFields } from "./block-fields/typeFields";
import { StyleChromeFields } from "./block-fields/StyleChrome";
import type { BlockFieldsProps } from "./block-fields/types";

export type { BlockFieldsProps } from "./block-fields/types";

/**
 * Per-type form rows for a single block. Used inline inside the
 * sortable BlockList — clicking the chevron on a row expands this
 * editor underneath.
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

  const inner = renderTypeFields(block, update, BlockFields);
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
