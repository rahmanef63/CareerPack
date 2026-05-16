"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { HeaderBgPicker } from "../builder/HeaderBgPicker";
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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <HeaderBgPicker value={headerBg.value} onChange={headerBg.onChange} />
      </CardContent>
    </Card>
  );
}
