"use client";

import { Columns3, Palette, Square } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { Bind } from "../form/types";
import { StyleCard } from "./StyleCard";

export interface ManualDesignCardProps {
  bind: Bind;
}

/**
 * Manual-mode "Tampilan" panel. Replaces ThemeCard (which is a
 * template picker — irrelevant for manual since manual always
 * renders on the canvas template). Shows the global Style controls
 * plus a brief explainer of where the other appearance controls
 * live (Container layout, per-block background).
 */
export function ManualDesignCard({ bind }: ManualDesignCardProps) {
  return (
    <div className="space-y-4">
      <Card className="border-brand/30 bg-gradient-to-br from-brand-muted/30 via-brand-muted/10 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-brand" />
            Tampilan halaman manual
          </CardTitle>
          <CardDescription>
            Manual selalu pakai template canvas. Atur warna, font, radius,
            kerapatan di bawah. Untuk layout (3 kolom desktop / carousel
            mobile) pakai blok <strong>Container</strong>. Untuk background
            per-blok, expand blok di tab Konten lalu buka{" "}
            <em>&ldquo;Tampilan blok&rdquo;</em>.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-xs sm:grid-cols-3">
          <div className="flex items-start gap-2 rounded-md bg-card/60 p-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand/15 text-brand">
              <Palette className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="font-semibold text-foreground">Style global</p>
              <p className="text-muted-foreground">
                Warna · font · radius · kerapatan
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-md bg-card/60 p-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <Columns3 className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="font-semibold text-foreground">Layout</p>
              <p className="text-muted-foreground">
                Bungkus blok dengan Container — pilih row / grid /
                carousel + tampilan mobile.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-md bg-card/60 p-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300">
              <Square className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="font-semibold text-foreground">Per-blok</p>
              <p className="text-muted-foreground">
                Background, padding, alignment teks — di edit blok masing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <StyleCard bind={bind} />
    </div>
  );
}
