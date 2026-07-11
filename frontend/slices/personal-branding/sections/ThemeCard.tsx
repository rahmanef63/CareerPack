"use client";

import { ThemePicker } from "../builder/ThemePicker";
import type { Bind } from "../form/types";

export interface ThemeCardProps {
  bind: Bind;
}

export function ThemeCard({ bind }: ThemeCardProps) {
  const theme = bind("theme");
  return <ThemePicker value={theme.value} onChange={theme.onChange} />;
}
