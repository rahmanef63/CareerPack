"use client";

import { Download, Sparkles, Upload } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { QuickFillButton } from "@/shared/components/onboarding/QuickFillButton";

/**
 * Import tab — guides the user through populating their Personal
 * Branding without manually filling every field.
 *
 * Path A (live): AI quick-fill — paste raw resume / LinkedIn export
 * into Claude/ChatGPT/Gemini, get back JSON, paste back here.
 * Implemented via the global QuickFillButton with `scope="profile"`.
 *
 * Path B (placeholder): structured import (LinkedIn URL, Notion doc,
 * Resume PDF). Slot exists for the next round; we surface it now so
 * users know it's coming.
 */
export function ImportCard() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle as="h3" className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-brand" />
            Isi Cepat dengan AI
          </CardTitle>
          <CardDescription>
            Paling cepat. Tempel CV / profil LinkedIn ke AI (Claude /
            ChatGPT / Gemini), dapat balasan JSON, tempel balik ke sini —
            CareerPack langsung isi semua field profile + CV + portofolio
            sekaligus. Personal Branding ikut update otomatis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
            <li>Klik <strong>Mulai Quick Fill</strong> di bawah.</li>
            <li>Pilih <em>scope</em> &quot;Profil&quot; (default), salin prompt yang ditampilkan.</li>
            <li>Tempel ke AI bersama dengan teks CV / LinkedIn Anda.</li>
            <li>Salin balasan AI (JSON), tempel ke step terakhir, klik Apply.</li>
          </ol>
          <QuickFillButton
            scope="profile"
            label="Mulai Quick Fill — scope Profil"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <CardTitle as="h3" className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4 text-muted-foreground" />
                Impor terstruktur
              </CardTitle>
              <CardDescription>
                Paste URL LinkedIn, dokumen Notion, atau upload PDF
                resume — kami akan parse otomatis tanpa lewat AI prompt.
              </CardDescription>
            </div>
            <Badge variant="outline" className="shrink-0">
              Segera hadir
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-xs text-muted-foreground">
            <Download className="mx-auto mb-2 h-5 w-5 opacity-50" />
            Untuk sementara pakai jalur AI di atas — hasil sama, hanya
            butuh 1–2 menit lebih.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
