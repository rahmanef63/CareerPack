"use client";

import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import type { parseQuickFillJSON } from "../lib/parser";
import type { buildPreview } from "../lib/preview";

type ParsedResult = ReturnType<typeof parseQuickFillJSON>;
type PreviewResult = ReturnType<typeof buildPreview>;

interface Props {
  pasted: string;
  setPasted: (s: string) => void;
  parsed: ParsedResult | null;
  preview: PreviewResult | null;
  submitting: boolean;
  canSubmit: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

export function PasteStep({
  pasted, setPasted, parsed, preview,
  submitting, canSubmit, onBack, onSubmit,
}: Props) {
  return (
    <div className="mt-4 space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">
          Tempel JSON dari respon AI:
        </p>
        <Textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder='Tempel JSON di sini. Contoh: { "profile": {...}, "cv": {...} }'
          rows={10}
          className="font-mono text-xs"
          spellCheck={false}
        />
      </div>

      {parsed?.ok === false && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs">
          <div className="flex items-start gap-2 text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">JSON belum bisa dibaca</p>
              <p className="mt-0.5">{parsed.error}</p>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="space-y-2 rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pratinjau yang akan dikirim
          </p>
          {preview.fatalErrors.length > 0 ? (
            <p className="text-xs text-destructive">
              {preview.fatalErrors[0]}
            </p>
          ) : preview.sections.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Belum ada section yang dikenal.
            </p>
          ) : (
            <ul className="space-y-1">
              {preview.sections.map((s) => (
                <li key={s.key} className="flex items-center gap-2 text-sm">
                  {s.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="font-medium">{s.label}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {s.count} item
                  </Badge>
                  {s.hint && (
                    <span className="text-xs text-muted-foreground">
                      · {s.hint}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-lg border border-amber-500/40 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        <p>
          <strong>Catatan:</strong> Quick Fill <em>tidak</em> menghapus
          data lama. Profil di-update; CV / portofolio / goals dst.
          ditambahkan sebagai entry baru. Jika Anda menjalankan ini 2×
          dengan data sama, akan ada duplikat — hapus manual via tabel
          masing-masing.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Kembali
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          className="gap-2"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {submitting ? "Mengimpor…" : "Kirim & Import"}
        </Button>
      </div>
    </div>
  );
}
