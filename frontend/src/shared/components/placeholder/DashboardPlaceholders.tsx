"use client";

import { HelpCircle } from "lucide-react";
import { PlaceholderView } from "@/shared/components/placeholder/PlaceholderView";

/**
 * Remaining placeholder view — only `help` still renders here. Others
 * (matcher, networking, portfolio, notifications) have been promoted to
 * full slices under `@/slices/*`.
 */

export function HelpView() {
  return (
    <PlaceholderView
      icon={HelpCircle}
      title="Pusat Bantuan"
      description="Tanya jawab, panduan penggunaan, dan kontak dukungan."
    />
  );
}
