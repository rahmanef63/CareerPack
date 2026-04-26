"use client";

import { Wrench } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";

/**
 * Yellow callout shown above the Manual block builder so users
 * understand what flips when they leave Otomatis: their CV / Profil
 * data is no longer auto-mirrored to the public page.
 */
export function ModeWarning() {
  return (
    <Card className="border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/20">
      <CardContent className="flex items-start gap-3 py-4 text-amber-800 dark:text-amber-300">
        <Wrench className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-xs">
          Mode <strong>Manual</strong> mengabaikan data CV / Profil /
          Portofolio — Anda menyusun blok sendiri. Cocok untuk yang mau
          full control. Untuk hasil instan dari data yang sudah ada,
          kembali ke <em>Otomatis</em>.
        </p>
      </CardContent>
    </Card>
  );
}
