"use client";

import { HeaderBgPicker } from "../builder/HeaderBgPicker";
import { SectionShell } from "./SectionShell";
import type { Bind, SectionOverrides } from "../form/types";

export interface HeaderBgCardProps extends SectionOverrides {
  bind: Bind;
}

export function HeaderBgCard({
  bind,
  title = "Header background",
  description = "Hero atas halaman. Pilih gradient siap pakai, warna solid, gambar URL, atau biarkan default brand wash.",
  className,
}: HeaderBgCardProps) {
  const headerBg = bind("headerBg");
  return (
    <SectionShell title={title} description={description} className={className}>
      <HeaderBgPicker value={headerBg.value} onChange={headerBg.onChange} />
    </SectionShell>
  );
}
