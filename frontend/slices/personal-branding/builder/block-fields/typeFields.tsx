"use client";

import type { Block } from "../../blocks/types";
import {
  HeadingFields, ParagraphFields, DividerFields, HtmlFields,
} from "./simpleFields";
import { LinkFields, SocialFields } from "./linkFields";
import { ImageFields, EmbedFields } from "./mediaFields";
import { ContainerFields } from "./containerField";
import type { BlockFieldsComponent, UpdateFn } from "./types";

export function renderTypeFields(
  block: Block,
  update: UpdateFn,
  BlockFields: BlockFieldsComponent,
) {
  switch (block.type) {
    case "heading":
      return <HeadingFields block={block} update={update} />;
    case "paragraph":
      return <ParagraphFields block={block} update={update} />;
    case "link":
      return <LinkFields block={block} update={update} />;
    case "social":
      return <SocialFields block={block} update={update} />;
    case "image":
      return <ImageFields block={block} update={update} />;
    case "embed":
      return <EmbedFields block={block} update={update} />;
    case "divider":
      return <DividerFields block={block} update={update} />;
    case "html":
      return <HtmlFields block={block} update={update} />;
    case "container":
      return (
        <ContainerFields block={block} update={update} BlockFields={BlockFields} />
      );
  }
}
