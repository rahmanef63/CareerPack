import type { Block, BlockType } from "../blocks/types";

/**
 * Block-id factory + default payload generators. Shared between
 * ManualBlocksCard's top-level "Tambah Blok" flow and BlockFields'
 * container "Tambah blok ke container" flow so both produce blocks
 * with the same baseline shape.
 */

export function newBlockId(): string {
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultBlockPayload(type: BlockType): Record<string, unknown> {
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
    case "container":
      return {
        layout: "row",
        mobileLayout: "auto",
        gap: "normal",
        align: "stretch",
        children: [],
      };
  }
}

export function makeBlock(type: BlockType): Block {
  return {
    id: newBlockId(),
    type,
    payload: defaultBlockPayload(type),
  } as unknown as Block;
}
