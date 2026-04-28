"use client";

import { Blocks, CheckCircle2, X } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";

/**
 * Manual mode header — frames the Block Builder as a CMS-style
 * authoring tool with explicit comparison vs Otomatis. Replaces the
 * old "yellow warning" pattern with a richer mode-introduction card
 * so first-timers know what they get + what they trade away.
 */
export function ModeWarning() {
  return (
    <Card className="border-brand/30 bg-gradient-to-br from-brand-muted/30 via-brand-muted/10 to-transparent">
      <CardContent className="space-y-3 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <Blocks className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">
              Mode Manual — CMS Block Builder
            </p>
            <p className="text-xs text-muted-foreground">
              Susun halaman block-by-block ala Webflow / Framer. Drag-drop
              ulang urutan, edit di tempat, dan atur warna + font + radius
              lewat tab <strong>Tampilan → Style</strong>.
            </p>
          </div>
        </div>
        <ul className="grid gap-1.5 text-[11px] sm:grid-cols-2">
          <li className="flex items-start gap-1.5 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />
            <span>Drag-drop block + edit inline</span>
          </li>
          <li className="flex items-start gap-1.5 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />
            <span>Style penuh: warna, font, radius, kerapatan</span>
          </li>
          <li className="flex items-start gap-1.5 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />
            <span>Preset blok untuk akselerasi</span>
          </li>
          <li className="flex items-start gap-1.5 text-rose-700 dark:text-rose-300">
            <X className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              Tidak auto-pull dari CV — pakai <em>Otomatis</em> untuk itu
            </span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
