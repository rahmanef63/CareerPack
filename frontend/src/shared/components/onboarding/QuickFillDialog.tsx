"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Loader2,
  RotateCcw,
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
import { useAuth } from "@/shared/hooks/useAuth";

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

type Step = "prompt" | "paste" | "history";

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
  const { state: authState } = useAuth();
  const isDemo = authState.isDemo;

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
    parsed?.ok &&
      preview &&
      preview.totalCount > 0 &&
      preview.fatalErrors.length === 0 &&
      !isDemo,
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
      const res = await quickFill({ payload: parsed.value, scope });
      setServerResult(res);
      const totalAdded =
        (res.profile ? 1 : 0) +
        (res.cv ? 1 : 0) +
        res.portfolio.added +
        res.goals.added +
        res.applications.added +
        res.contacts.added;
      const totalSkipped =
        res.portfolio.skipped +
        res.goals.skipped +
        res.applications.skipped +
        res.contacts.skipped;
      if (totalAdded === 0) {
        // Server accepted the call but every section was rejected —
        // tell the user so they don't think it succeeded silently.
        notify.warning(
          totalSkipped > 0
            ? `Tidak ada item yang masuk — ${totalSkipped} dilewati. Cek pratinjau di hasil import.`
            : "Tidak ada item yang masuk. Pastikan JSON punya section yang dikenal (profile / cv / portfolio / goals / applications / contacts) dengan field minimum.",
        );
      } else if (totalSkipped > 0) {
        notify.success(
          `Berhasil mengimpor ${totalAdded} item (${totalSkipped} dilewati)`,
        );
      } else {
        notify.success(`Berhasil mengimpor ${totalAdded} item`);
      }
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

        {isDemo && (
          // Promoted out of the scrollable body so the user sees the
          // block-reason as the FIRST thing in the dialog. Anonymous
          // Tamu sessions write to Convex but read from localStorage —
          // imports succeed silently and never show in the UI.
          <div className="shrink-0 rounded-lg border-2 border-destructive bg-destructive/10 p-4 text-sm">
            <p className="flex items-center gap-2 font-bold text-destructive">
              <AlertCircle className="h-5 w-5" />
              Mode demo (Tamu) — Import diblokir
            </p>
            <p className="mt-1.5 leading-snug text-destructive/90">
              Akun demo menyimpan data <strong>hanya di browser lokal</strong>.
              Quick Fill menulis ke server, jadi hasil import <strong>tidak akan terlihat</strong>{" "}
              di CV / Portfolio / dst — itu sebabnya CV Anda terus muncul sebagai
              data demo bawaan.
            </p>
            <p className="mt-2 leading-snug text-destructive/90">
              <strong>Solusi:</strong> Logout → klik &ldquo;Login&rdquo; → daftar pakai
              email asli (gratis), lalu jalankan Isi Cepat dari akun tersebut.
            </p>
          </div>
        )}

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
              <TabsTrigger value="history" className="gap-1.5">
                Riwayat
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

            <TabsContent value="history" className="mt-4">
              <BatchHistoryPanel />
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
  const totalAdded = rows.reduce((s, r) => s + r.count, 0);
  const totalSkipped = rows.reduce((s, r) => s + r.skipped, 0);
  const allFailed = totalAdded === 0;
  const partialFail = !allFailed && (totalSkipped > 0 || rows.some((r) => !r.ok));

  const handleCopyDebug = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      notify.success("Debug log disalin — paste di chat support");
    } catch {
      notify.warning("Gagal menyalin");
    }
  };

  return (
    <div className="space-y-4 mt-2">
      {/* Header banner — color reflects outcome severity. */}
      {allFailed ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-semibold">Tidak ada item yang berhasil masuk</p>
          </div>
          <p className="mt-1 text-xs text-destructive/90">
            Lihat catatan di bawah untuk alasan tiap section dilewati.
          </p>
        </div>
      ) : partialFail ? (
        <div className="rounded-xl border border-amber-500/50 bg-amber-50 p-4 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-semibold">
              Sebagian masuk — {totalAdded} berhasil, {totalSkipped} dilewati
            </p>
          </div>
          <p className="mt-1 text-xs text-amber-700/90 dark:text-amber-300/90">
            Section yang gagal ditandai merah. Lihat catatan di bawah.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 p-4 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-semibold">Import selesai — {totalAdded} item masuk</p>
          </div>
        </div>
      )}

      {/* Warnings — promoted up so user reads them BEFORE the per-row list. */}
      {result.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-50 p-3 dark:bg-amber-950/30">
          <p className="mb-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
            Catatan dari server
          </p>
          <ul className="ml-4 list-disc space-y-1 text-xs text-amber-900 dark:text-amber-200">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <ul className="space-y-2 rounded-xl border border-border bg-card p-3">
        {rows.map((r) => (
          <li
            key={r.label}
            className={cn(
              "flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 text-sm",
              r.count === 0 && "bg-destructive/5",
            )}
          >
            {r.ok ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : r.count === 0 ? (
              <AlertCircle className="h-4 w-4 text-destructive" />
            ) : (
              <span className="block h-2 w-2 rounded-full bg-muted-foreground/40" />
            )}
            <span className="font-medium min-w-[6rem]">{r.label}</span>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                r.count === 0 && "border-destructive/40 text-destructive",
              )}
            >
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
            {r.count === 0 && (
              <span className="text-[11px] font-medium text-destructive">
                tidak masuk
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleCopyDebug}>
          <ClipboardCopy className="mr-1.5 h-3.5 w-3.5" /> Salin Debug
        </Button>
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

/**
 * Riwayat tab — shows every Quick Fill batch the user has run, newest
 * first, with an Undo button. Undo only deletes the rows the batch
 * inserted, preserving anything the user has manually added since.
 */
function BatchHistoryPanel() {
  const batches = useQuery(api.onboarding.queries.listBatches, {});
  const undoBatch = useMutation(api.onboarding.mutations.undoBatch);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleUndo = async (batchId: string) => {
    if (busyId) return;
    if (!confirm("Yakin batalkan import ini? Item yang dimasukkan batch ini akan dihapus permanen, profil dikembalikan ke versi sebelum import.")) {
      return;
    }
    setBusyId(batchId);
    try {
      const res = await undoBatch({ batchId: batchId as Parameters<typeof undoBatch>[0]["batchId"] });
      notify.success(`Dibatalkan — ${res.deleted} item dihapus`);
    } catch (err) {
      notify.fromError(err, "Gagal membatalkan");
    } finally {
      setBusyId(null);
    }
  };

  if (batches === undefined) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (batches.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Belum ada riwayat. Setelah Anda menjalankan Isi Cepat, semua import akan
        muncul di sini — bisa di-undo individual kalau salah data.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Hapus seluruh isi import ini sekaligus jika datanya salah. Profil akan
        dikembalikan ke versi sebelum import (kalau batch ini menyentuh profil).
      </p>
      {batches.map((b) => {
        const counts: string[] = [];
        if (b.profileTouched) counts.push("profil");
        if (b.cvIds.length) counts.push(`${b.cvIds.length} CV`);
        if (b.portfolioIds.length) counts.push(`${b.portfolioIds.length} portofolio`);
        if (b.goalIds.length) counts.push(`${b.goalIds.length} goal`);
        if (b.applicationIds.length) counts.push(`${b.applicationIds.length} lamaran`);
        if (b.contactIds.length) counts.push(`${b.contactIds.length} kontak`);
        const label = counts.length > 0 ? counts.join(" · ") : "kosong";
        const date = new Date(b.createdAt);
        const dateStr = date.toLocaleString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const isBusy = busyId === b._id;
        return (
          <div
            key={b._id}
            className={cn(
              "rounded-lg border bg-card p-3",
              b.undone ? "border-border opacity-60" : "border-border",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {b.scope}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{dateStr}</span>
                  {b.undone && (
                    <Badge
                      variant="outline"
                      className="border-destructive/40 text-[10px] text-destructive"
                    >
                      Sudah dibatalkan
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium">{label}</p>
                {b.warnings.length > 0 && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                    {b.warnings[0]}
                  </p>
                )}
              </div>
              <div className="shrink-0">
                {b.undone ? (
                  <span className="text-[11px] text-muted-foreground">—</span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => handleUndo(b._id)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Batalkan
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
