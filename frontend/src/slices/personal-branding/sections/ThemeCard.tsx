"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ThemePicker } from "../builder/ThemePicker";
import type { Bind, SectionOverrides } from "../form/types";

export interface ThemeCardProps extends SectionOverrides {
  bind: Bind;
  noCard?: boolean;
}

export function ThemeCard({
  bind,
  title = "Pilih tema",
  description = "Tema mengubah layout — Stack klasik, Bento grid, atau Editorial. Berlaku untuk Otomatis maupun Manual.",
  className,
  noCard = false,
}: ThemeCardProps) {
  const theme = bind("theme");
  const picker = <ThemePicker value={theme.value} onChange={theme.onChange} />;

  if (noCard) return picker;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{picker}</CardContent>
    </Card>
  );
}
