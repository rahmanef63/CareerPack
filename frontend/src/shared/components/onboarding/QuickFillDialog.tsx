"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { Sparkles } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { notify } from "@/shared/lib/notify";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

import type {
  QuickFillScope,
  QuickFillResult,
} from "../../../../../convex/onboarding/types";
import { buildPrompt } from "./lib/promptBuilder";
import { parseQuickFillJSON } from "./lib/parser";
import { buildPreview } from "./lib/preview";
import { PromptStep } from "./quick-fill/PromptStep";
import { PasteStep } from "./quick-fill/PasteStep";
import { ResultPanel } from "./quick-fill/ResultPanel";
import { BatchHistoryPanel } from "./quick-fill/BatchHistoryPanel";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Pre-selected scope when the dialog opens. Default: "all". */
  initialScope?: QuickFillScope;
}

type Step = "prompt" | "paste" | "history";

/**
 * Quick Fill — 2-step wizard.
 * 1. Pick scope, copy the schema-embedded prompt to use with any LLM.
 * 2. Paste the LLM's JSON reply, get a live preview summary, send.
 */
export function QuickFillDialog({
  open,
  onOpenChange,
  initialScope = "all",
}: Props) {
  const quickFill = useMutation(api.onboarding.mutations.quickFill);

  const [scope, setScope] = useState<QuickFillScope>(initialScope);

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
      preview.fatalErrors.length === 0,
  );

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
                <TabsTrigger value="history" className="gap-1.5">
                  Riwayat
                </TabsTrigger>
              </TabsList>

              <TabsContent value="prompt">
                <PromptStep
                  scope={scope}
                  setScope={setScope}
                  prompt={prompt}
                  onNext={() => setStep("paste")}
                />
              </TabsContent>

              <TabsContent value="paste">
                <PasteStep
                  pasted={pasted}
                  setPasted={setPasted}
                  parsed={parsed}
                  preview={preview}
                  submitting={submitting}
                  canSubmit={canSubmit}
                  onBack={() => setStep("prompt")}
                  onSubmit={handleSubmit}
                />
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
