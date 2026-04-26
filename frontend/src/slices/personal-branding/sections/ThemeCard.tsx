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
}

export function ThemeCard({
  bind,
  title = "Pilih tema",
  description = "Tema mengubah layout — Stack klasik, Bento grid, atau Editorial. Berlaku untuk Otomatis maupun Manual.",
  className,
}: ThemeCardProps) {
  const theme = bind("theme");
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ThemePicker value={theme.value} onChange={theme.onChange} />
      </CardContent>
    </Card>
  );
}
