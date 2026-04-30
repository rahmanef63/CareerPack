"use client";

import { Check, ClipboardCopy } from "lucide-react";
import { notify } from "@/shared/lib/notify";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  SCOPE_LABELS,
  type QuickFillScope,
} from "../../../../../../convex/onboarding/types";

export const SCOPE_ORDER: QuickFillScope[] = [
  "all",
  "profile-cv",
  "profile",
  "cv",
  "portfolio",
  "goals",
  "applications",
  "contacts",
];

interface Props {
  scope: QuickFillScope;
  setScope: (s: QuickFillScope) => void;
  prompt: string;
  onNext: () => void;
}

export function PromptStep({ scope, setScope, prompt, onNext }: Props) {
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      notify.success("Prompt disalin — buka ChatGPT / Claude / Gemini, paste, lalu kirim");
    } catch {
      notify.warning("Gagal menyalin — pilih teks manual lalu Ctrl+C");
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">Pilih lingkup:</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SCOPE_ORDER.map((s) => {
            const meta = SCOPE_LABELS[s];
            const active = s === scope;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={cn(
                  "rounded-lg border bg-card p-3 text-left transition-all",
                  active
                    ? "border-brand ring-2 ring-brand/30"
                    : "border-border hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{meta.title}</span>
                  {active && <Check className="h-4 w-4 text-brand" />}
                </div>
                <p className="mt-1 text-xs leading-snug text-muted-foreground line-clamp-2">
                  {meta.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Prompt siap pakai
          </p>
          <Button
            type="button"
            size="sm"
            onClick={handleCopyPrompt}
            className="gap-1.5"
          >
            <ClipboardCopy className="h-3.5 w-3.5" />
            Salin
          </Button>
        </div>
        <pre className="max-h-72 overflow-auto rounded-md bg-background p-3 text-[11px] leading-relaxed text-foreground/90">
          {prompt}
        </pre>
      </div>

      <div className="rounded-lg border border-sky-500/40 bg-sky-50 p-3 text-xs text-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
        <p className="font-semibold">Cara pakai:</p>
        <ol className="ml-5 mt-1 list-decimal space-y-0.5">
          <li>Klik &ldquo;Salin&rdquo; di atas.</li>
          <li>
            Buka <strong>ChatGPT / Claude / Gemini / model lain</strong>,
            paste prompt-nya.
          </li>
          <li>
            Pada bagian &ldquo;Tempelkan info Anda di sini&rdquo;,
            ganti dengan info diri Anda (CV text, LinkedIn export, atau
            cerita bebas).
          </li>
          <li>
            Salin balasan AI berupa JSON, lalu pindah ke tab{" "}
            <strong>2. Tempel &amp; Kirim</strong>.
          </li>
        </ol>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={onNext}>
          Lanjut → Tempel JSON
        </Button>
      </div>
    </div>
  );
}
