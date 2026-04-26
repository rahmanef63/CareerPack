"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { notify } from "@/shared/lib/notify";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { cn } from "@/shared/lib/utils";

import {
  SCOPE_LABELS,
  type QuickFillScope,
  type QuickFillResult,
} from "../../../../../convex/onboarding/types";
import { buildPrompt } from "./lib/promptBuilder";
import { parseQuickFillJSON } from "./lib/parser";
import { buildPreview } from "./lib/preview";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Pre-selected scope when the dialog opens. Default: "all". */
  initialScope?: QuickFillScope;
}

const SCOPE_ORDER: QuickFillScope[] = [
  "all",
  "profile-cv",
  "profile",
  "cv",
  "portfolio",
  "goals",
  "applications",
  "contacts",
];

type Step = "prompt" | "paste";

/**
 * Quick Fill — 2-step wizard.
 * 1. Pick scope, copy the schema-embedded prompt to use with any LLM.
 * 2. Paste the LLM's JSON reply, get a live preview summary, send.
 *
 * Server validation is the source of truth. Client preview is a
 * fast sanity check; the Send button isn't a security gate.
 */
export function QuickFillDialog({
  open,
  onOpenChange,
  initialScope = "all",
}: Props) {
  const quickFill = useMutation(api.onboarding.mutations.quickFill);

  const [scope, setScope] = useState<QuickFillScope>(initialScope);

  // Re-sync scope each time the dialog opens — caller may pass a
  // different `initialScope` on different mounts (e.g. CV page vs
  // Portfolio page sharing the same global button instance).
  useMemo(() => {
    if (open) setScope(initialScope);
  }, [open, initialScope]);
  const [step, setStep] = useState<Step>("prompt");
  const [pasted, setPasted] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverResult, setServerResult] = useState<QuickFillResult | null>(null);

  const prompt = useMemo(() => buildPrompt(scope), [scope]);

  const parsed = useMemo(() => {
    if (!pasted.trim()) return null;
    return parseQuickFillJSON(pasted);
  }, [pasted]);

  const preview = useMemo(() => {
    if (!parsed?.ok) return null;
    return buildPreview(parsed.value);
  }, [parsed]);

  const canSubmit = Boolean(
    parsed?.ok && preview && preview.totalCount > 0 && preview.fatalErrors.length === 0,
  );

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      notify.success("Prompt disalin — buka ChatGPT / Claude / Gemini, paste, lalu kirim");
    } catch {
      notify.warning("Gagal menyalin — pilih teks manual lalu Ctrl+C");
    }
  };

  const handleSubmit = async () => {
    if (!parsed?.ok) return;
    setSubmitting(true);
    try {
      const res = await quickFill({ payload: parsed.value });
      setServerResult(res);
      const totalAdded =
        (res.profile ? 1 : 0) +
        (res.cv ? 1 : 0) +
        res.portfolio.added +
        res.goals.added +
        res.applications.added +
        res.contacts.added;
      notify.success(`Berhasil mengimpor ${totalAdded} item`);
    } catch (err) {
      notify.fromError(err, "Gagal mengimpor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (o: boolean) => {
    if (!o) {
      // Reset on close so reopen feels fresh.
      setStep("prompt");
      setPasted("");
      setServerResult(null);
    }
    onOpenChange(o);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleClose}>
      <ResponsiveDialogContent
        size="full"
        className="flex max-h-[92vh] flex-col gap-3 overflow-hidden p-4 sm:p-6"
        drawerClassName="max-h-[92vh]"
        aria-describedby={undefined}
      >
        <ResponsiveDialogHeader className="shrink-0">
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand" />
            Isi Cepat dengan AI
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Pilih lingkup data yang mau diisi. Salin prompt yang muncul ke
            ChatGPT / Claude / Gemini bersama info diri Anda. Tempel hasil JSON
            di sini — kami sanitasi + import otomatis.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="-mx-4 flex-1 overflow-y-auto px-4 sm:-mx-6 sm:px-6">
        {serverResult ? (
          <ResultPanel
            result={serverResult}
            onDone={() => handleClose(false)}
            onRunAgain={() => {
              setServerResult(null);
              setPasted("");
              setStep("prompt");
            }}
          />
        ) : (
          <Tabs value={step} onValueChange={(v) => setStep(v as Step)}>
            <TabsList variant="pills" className="mt-2">
              <TabsTrigger value="prompt" className="gap-1.5">
                <span className="font-semibold">1.</span> Salin Prompt
              </TabsTrigger>
              <TabsTrigger value="paste" className="gap-1.5">
                <span className="font-semibold">2.</span> Tempel & Kirim
              </TabsTrigger>
            </TabsList>

            <TabsContent value="prompt" className="mt-4 space-y-4">
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
                <Button type="button" onClick={() => setStep("paste")}>
                  Lanjut → Tempel JSON
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="paste" className="mt-4 space-y-4">
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
                        <li
                          key={s.key}
                          className="flex items-center gap-2 text-sm"
                        >
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("prompt")}
                >
                  ← Kembali
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
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
            </TabsContent>
          </Tabs>
        )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function ResultPanel({
  result,
  onDone,
  onRunAgain,
}: {
  result: QuickFillResult;
  onDone: () => void;
  onRunAgain: () => void;
}) {
  const rows = [
    { label: "Profil", ok: result.profile, count: result.profile ? 1 : 0, skipped: 0 },
    { label: "CV", ok: result.cv, count: result.cv ? 1 : 0, skipped: 0 },
    {
      label: "Portofolio",
      ok: result.portfolio.added > 0,
      count: result.portfolio.added,
      skipped: result.portfolio.skipped,
    },
    {
      label: "Goals",
      ok: result.goals.added > 0,
      count: result.goals.added,
      skipped: result.goals.skipped,
    },
    {
      label: "Lamaran",
      ok: result.applications.added > 0,
      count: result.applications.added,
      skipped: result.applications.skipped,
    },
    {
      label: "Kontak",
      ok: result.contacts.added > 0,
      count: result.contacts.added,
      skipped: result.contacts.skipped,
    },
  ];
  return (
    <div className="space-y-4 mt-2">
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 p-4 dark:bg-emerald-950/30">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-sm font-semibold">Import selesai</p>
        </div>
      </div>

      <ul className="space-y-2 rounded-xl border border-border bg-card p-3">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-2 text-sm">
            {r.ok ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <span className="block h-2 w-2 rounded-full bg-muted-foreground/40" />
            )}
            <span className="font-medium min-w-[6rem]">{r.label}</span>
            <Badge variant="outline" className="text-[10px]">
              + {r.count}
            </Badge>
            {r.skipped > 0 && (
              <Badge
                variant="outline"
                className="border-amber-500/40 text-[10px] text-amber-600"
              >
                {r.skipped} dilewati
              </Badge>
            )}
          </li>
        ))}
      </ul>

      {result.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-50 p-3 dark:bg-amber-950/30">
          <p className="mb-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            Catatan
          </p>
          <ul className="ml-4 list-disc space-y-0.5 text-xs text-amber-900 dark:text-amber-200">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onRunAgain}>
          Import lagi
        </Button>
        <Button type="button" onClick={onDone}>
          Selesai
        </Button>
      </div>
    </div>
  );
}
