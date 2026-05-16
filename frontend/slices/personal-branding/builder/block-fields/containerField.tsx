"use client";

import { Label } from "@/shared/components/ui/label";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import type { Block } from "../../blocks/types";
import { ContainerChildrenEditor } from "./ContainerChildren";
import type { BlockFieldsComponent, UpdateFn } from "./types";

interface Props {
  block: Block;
  update: UpdateFn;
  BlockFields: BlockFieldsComponent;
}

export function ContainerFields({ block, update, BlockFields }: Props) {
  const p = block.payload as {
    layout?: string; mobileLayout?: string; gap?: string;
    align?: string; children?: Block[];
  };
  const children = p.children ?? [];
  const setChildren = (next: Block[]) => update("children", next);
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Layout</Label>
          <ResponsiveSelect
            value={p.layout ?? "row"}
            onValueChange={(v) => update("layout", v)}
          >
            <ResponsiveSelectTrigger />
            <ResponsiveSelectContent drawerTitle="Layout container">
              <ResponsiveSelectItem value="stack">Stack (kolom)</ResponsiveSelectItem>
              <ResponsiveSelectItem value="row">Baris (auto wrap)</ResponsiveSelectItem>
              <ResponsiveSelectItem value="grid-2">Grid 2 kolom</ResponsiveSelectItem>
              <ResponsiveSelectItem value="grid-3">Grid 3 kolom</ResponsiveSelectItem>
              <ResponsiveSelectItem value="grid-4">Grid 4 kolom</ResponsiveSelectItem>
              <ResponsiveSelectItem value="carousel">Carousel (geser)</ResponsiveSelectItem>
            </ResponsiveSelectContent>
          </ResponsiveSelect>
        </div>
        <div className="space-y-1">
          <Label>Tampilan mobile</Label>
          <ResponsiveSelect
            value={p.mobileLayout ?? "auto"}
            onValueChange={(v) => update("mobileLayout", v)}
          >
            <ResponsiveSelectTrigger />
            <ResponsiveSelectContent drawerTitle="Tampilan mobile">
              <ResponsiveSelectItem value="auto">Auto (stack)</ResponsiveSelectItem>
              <ResponsiveSelectItem value="stack">Selalu stack</ResponsiveSelectItem>
              <ResponsiveSelectItem value="carousel">Carousel</ResponsiveSelectItem>
            </ResponsiveSelectContent>
          </ResponsiveSelect>
        </div>
        <div className="space-y-1">
          <Label>Jarak antar blok</Label>
          <ResponsiveSelect
            value={p.gap ?? "normal"}
            onValueChange={(v) => update("gap", v)}
          >
            <ResponsiveSelectTrigger />
            <ResponsiveSelectContent drawerTitle="Jarak">
              <ResponsiveSelectItem value="tight">Rapat</ResponsiveSelectItem>
              <ResponsiveSelectItem value="normal">Normal</ResponsiveSelectItem>
              <ResponsiveSelectItem value="loose">Lapang</ResponsiveSelectItem>
            </ResponsiveSelectContent>
          </ResponsiveSelect>
        </div>
        <div className="space-y-1">
          <Label>Alignment</Label>
          <ResponsiveSelect
            value={p.align ?? "stretch"}
            onValueChange={(v) => update("align", v)}
          >
            <ResponsiveSelectTrigger />
            <ResponsiveSelectContent drawerTitle="Alignment">
              <ResponsiveSelectItem value="stretch">Lebar penuh</ResponsiveSelectItem>
              <ResponsiveSelectItem value="start">Atas / kiri</ResponsiveSelectItem>
              <ResponsiveSelectItem value="center">Tengah</ResponsiveSelectItem>
              <ResponsiveSelectItem value="end">Bawah / kanan</ResponsiveSelectItem>
            </ResponsiveSelectContent>
          </ResponsiveSelect>
        </div>
      </div>
      <ContainerChildrenEditor
        items={children}
        onChange={setChildren}
        BlockFields={BlockFields}
      />
    </div>
  );
}
