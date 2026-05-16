import type { Block } from "../../blocks/types";

export type UpdateFn = (key: string, value: unknown) => void;

export interface BlockFieldsProps {
  block: Block;
  onChange: (next: Block) => void;
  /** When true, the per-block style-chrome editor is hidden — used
   *  for container children where the parent container's style is
   *  what matters most. */
  hideStyleChrome?: boolean;
}

export type BlockFieldsComponent = (props: BlockFieldsProps) => React.ReactElement;
