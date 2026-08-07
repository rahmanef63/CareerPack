"use client";

import { useRef } from "react";
import {
  AlertCircle,
  FileUp,
  Info,
  Loader2,
  ScanText,
  Sparkles,
  UserPlus,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";

/** Minimum characters the parse action accepts. Mirrored here so the button
 *  can be disabled instead of the user paying a round-trip to be refused. */
const MIN_TEXT = 40;

export type UploadPhase = "upload" | "extracting" | "parsing" | "review-text";

export interface UploadStepProps {
  phase: UploadPhase;
  isDemo: boolean;
  /** Profile + CV queries have landed, so a plan built now sees the real data. */
  ready: boolean;
  /** The resolved AI model is outside the catalog — it may or may not read
   *  images, and the only way to find out is to try. */
  visionUnverified: boolean;
  /** Name of the file currently loaded, if any. */
  fileName: string | null;
  /** Page-level progress while a PDF is being read or rasterised. */
  progress: { page: number; total: number } | null;
  /** True while the AI is reading rasterised pages rather than plain text. */
  ocrRunning: boolean;
  /** The PDF had no usable text layer — offer the escalation, never take it. */
  ocrOffer: boolean;
  /** Manual paste area is open. */
  manual: boolean;
  rawText: string;
  onRawTextChange: (text: string) => void;
  onToggleManual: () => void;
  onPickFile: (file: File) => void;
  onEscalateOcr: () => void;
  onParseText: () => void;
  /** Back to the picker — the only way out of `review-text` when the file
   *  turned out to be unreadable and there is no text to fix. */
  onRestart: () => void;
  onSignUp: () => void;
}

/**
 * Screens ① and ②: pick a file, watch it being read, and — when the PDF turns
 * out to be a scan — decide whether to spend an AI call on it. Also the
 * landing spot when the parser came back empty, where the extracted text is
 * editable and can be re-parsed.
 */
export function UploadStep({
  phase,
  isDemo,
  ready,
  visionUnverified,
  fileName,
  progress,
  ocrRunning,
  ocrOffer,
  manual,
  rawText,
  onRawTextChange,
  onToggleManual,
  onPickFile,
  onEscalateOcr,
  onParseText,
  onRestart,
  onSignUp,
}: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const blocked = isDemo || !ready;

  if (phase === "extracting" || phase === "parsing") {
    return <Busy phase={phase} progress={progress} ocrRunning={ocrRunning} />;
  }

  if (phase === "review-text") {
    return (
      <div className="space-y-3">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Belum ketemu isinya</AlertTitle>
          <AlertDescription>
            AI tidak menemukan data CV di file ini. Perbaiki teks lalu coba
            lagi, atau isi manual.
          </AlertDescription>
        </Alert>
        <Textarea
          value={rawText}
          onChange={(event) => onRawTextChange(event.target.value)}
          rows={10}
          spellCheck={false}
          className="text-xs"
          aria-label="Teks CV"
        />
        <Button
          type="button"
          onClick={onParseText}
          disabled={blocked || rawText.trim().length < MIN_TEXT}
          className="w-full gap-2 bg-brand hover:bg-brand"
        >
          <Sparkles className="h-4 w-4" />
          Parse ulang
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onRestart}>
          Pilih file lain
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isDemo && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Mode demo — impor dimatikan</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              Akun demo menyimpan data hanya di browser ini. Impor menulis ke
              server, jadi hasilnya tidak akan terlihat di layar kamu.
            </p>
            <Button type="button" size="sm" onClick={onSignUp}>
              <UserPlus className="h-3.5 w-3.5" />
              Daftar gratis untuk impor CV
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
        <FileUp className="mx-auto mb-3 h-7 w-7 text-brand" aria-hidden />
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
          Unggah CV kamu — PDF atau foto. Kami baca isinya, lalu tunjukkan apa
          yang berubah sebelum menyimpan.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Clearing lets the same file be picked again after a failure.
            event.target.value = "";
            if (file) onPickFile(file);
          }}
        />
        <Button
          type="button"
          className="mt-4 gap-2 bg-brand hover:bg-brand"
          disabled={blocked}
          onClick={() => inputRef.current?.click()}
        >
          <FileUp className="h-4 w-4" />
          {fileName ? "Ganti file" : "Pilih file CV"}
        </Button>
        {fileName && (
          <p className="mt-2 truncate text-xs text-muted-foreground">{fileName}</p>
        )}
      </div>

      {visionUnverified && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Cek model AI kamu</AlertTitle>
          <AlertDescription>
            Model AI kamu belum terverifikasi bisa membaca gambar. Kalau gagal,
            ganti model di Setelan → AI.
          </AlertDescription>
        </Alert>
      )}

      {ocrOffer && (
        <Alert>
          <ScanText className="h-4 w-4" />
          <AlertTitle>PDF ini sepertinya hasil scan</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              Tidak ada lapisan teks di dalamnya, jadi kami perlu membacanya
              dengan AI. Ini memakai kuota AI kamu.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={blocked}
              onClick={onEscalateOcr}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Baca dengan AI (1 kuota)
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {manual ? (
        <div className="space-y-2">
          <label
            htmlFor="cv-import-manual"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Tempel isi CV kamu
          </label>
          <Textarea
            id="cv-import-manual"
            value={rawText}
            onChange={(event) => onRawTextChange(event.target.value)}
            rows={8}
            spellCheck={false}
            className="text-xs"
            placeholder="Salin seluruh isi CV kamu ke sini…"
          />
          <Button
            type="button"
            onClick={onParseText}
            disabled={blocked || rawText.trim().length < MIN_TEXT}
            className="w-full gap-2 bg-brand hover:bg-brand"
          >
            <Sparkles className="h-4 w-4" />
            Baca teks ini
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={blocked}
          onClick={onToggleManual}
        >
          Tempel teks manual
        </Button>
      )}
    </div>
  );
}

function Busy({
  phase,
  progress,
  ocrRunning,
}: {
  phase: "extracting" | "parsing";
  progress: { page: number; total: number } | null;
  ocrRunning: boolean;
}) {
  const line =
    phase === "extracting"
      ? progress
        ? `Membaca halaman ${progress.page} dari ${progress.total}…`
        : "Membuka file…"
      : ocrRunning
        ? "PDF ini hasil scan — kami baca pakai AI, sekitar 15 detik."
        : "AI sedang menyusun isi CV kamu…";

  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-brand" aria-hidden />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {line}
      </p>
    </div>
  );
}
