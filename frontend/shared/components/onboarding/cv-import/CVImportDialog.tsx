"use client";

import Link from "next/link";
import { CheckCircle2, FileUp, Info, Undo2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@/shared/components/ui/responsive-alert-dialog";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import { useAuth } from "@/shared/hooks/useAuth";
import { ROUTES } from "@/shared/lib/routes";

import { ConflictPager, ConflictPagerFooter, ConflictPagerHeader } from "./ConflictPager";
import { PlanSummary } from "./PlanSummary";
import { UploadStep } from "./UploadStep";
import { useCvImportFlow } from "./useCvImportFlow";

export interface CVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplied?: () => void;
  /** The CV the caller has on screen. Absent (onboarding) → newest. */
  cvId?: string | null;
}

/**
 * Owns every piece of import state, deliberately — `useCvImportFlow` is called
 * here and nowhere below, so the state lives in this component's fiber.
 *
 * `<ResponsiveDialog>`'s root swaps a radix Dialog for a vaul Drawer at
 * 1024 px and unmounts the whole subtree when it does; `useIsMobile()` also
 * starts out `undefined`, so a phone paints a Dialog first and remounts as a
 * Drawer one tick later. Anything held below this component would be lost on
 * both transitions, which on a phone means immediately.
 */
export function CVImportDialog({ open, onOpenChange, onApplied, cvId }: CVImportDialogProps) {
  const { logout } = useAuth();
  const flow = useCvImportFlow({ onOpenChange, onApplied, cvId });

  const {
    phase,
    plan,
    conflicts,
    decisions,
    idx,
    batchId,
    warnings,
  } = flow;

  const current = conflicts[idx];
  const pagerMode = phase === "conflicts" && Boolean(current);

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={(next) => (next ? onOpenChange(true) : flow.requestClose())}
      >
        {pagerMode && current ? (
          <ResponsiveDialogContent
            size="2xl"
            bodyClassName="pt-4"
            stickyHeader={
              <>
                <ResponsiveDialogTitle className="sr-only">
                  Tinjau perbedaan dari CV
                </ResponsiveDialogTitle>
                <ResponsiveDialogDescription className="sr-only">
                  Pilih nilai mana yang dipakai untuk setiap perbedaan.
                </ResponsiveDialogDescription>
                <ConflictPagerHeader conflict={current} idx={idx} total={conflicts.length} />
              </>
            }
            stickyFooter={
              <ConflictPagerFooter
                idx={idx}
                total={conflicts.length}
                applyCount={flow.applyCount}
                applying={false}
                onPrev={() => flow.navigate(Math.max(0, idx - 1))}
                onNext={() => flow.navigate(Math.min(conflicts.length - 1, idx + 1))}
                onFinish={() => flow.goTo("confirm")}
                onApply={() => void flow.handleApply()}
              />
            }
          >
            <ConflictPager
              conflict={current}
              decision={decisions[current.id]}
              onChoose={flow.choose}
            />
          </ResponsiveDialogContent>
        ) : (
          <ResponsiveDialogContent size="2xl">
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5 text-brand" aria-hidden />
                Impor dari CV
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                {phase === "done"
                  ? "Impor selesai."
                  : "Kami baca CV kamu dulu, lalu tunjukkan apa yang berubah sebelum menyimpan."}
              </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>

            {(phase === "upload" ||
              phase === "extracting" ||
              phase === "parsing" ||
              phase === "review-text") && (
              <UploadStep
                phase={phase}
                isDemo={flow.isDemo}
                ready={flow.ready}
                visionUnverified={flow.visionUnverified}
                fileName={flow.source?.name ?? null}
                progress={flow.progress}
                ocrRunning={flow.ocrRunning}
                ocrOffer={flow.ocrOffer}
                manual={flow.manual}
                rawText={flow.rawText}
                onRawTextChange={flow.setRawText}
                onToggleManual={flow.openManual}
                onPickFile={(file) => void flow.handleFile(file)}
                onEscalateOcr={() => void flow.escalateOcr()}
                onParseText={flow.parseRawText}
                onRestart={flow.restart}
                onSignUp={() => void logout(ROUTES.auth.login)}
              />
            )}

            {(phase === "summary" || phase === "confirm" || phase === "applying") && plan && (
              <PlanSummary
                mode={
                  phase === "applying"
                    ? flow.applyFrom
                    : phase === "summary"
                      ? "summary"
                      : "confirm"
                }
                plan={plan}
                decisions={decisions}
                cvChoices={flow.cvChoices}
                targetCvId={flow.targetCvId}
                onSelectCv={flow.reanalyseFor}
                overwriteAll={flow.overwriteAll}
                applying={phase === "applying"}
                onApply={() => void flow.handleApply()}
                onReview={() => flow.goTo("conflicts")}
                onUseAll={flow.useAllFromCv}
                onBack={flow.dropPlan}
                onClose={flow.close}
              />
            )}

            {phase === "done" && (
              <DoneStep
                warnings={warnings}
                canUndo={batchId !== null}
                onUndo={() => flow.setConfirmUndo(true)}
                onClose={flow.close}
              />
            )}
          </ResponsiveDialogContent>
        )}
      </ResponsiveDialog>

      <ResponsiveAlertDialog open={flow.confirmExit} onOpenChange={flow.setConfirmExit}>
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>Keluar tanpa menyimpan?</ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              {conflicts.length} keputusan kamu akan hilang. Data yang sudah ada
              tidak berubah.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Batal</ResponsiveAlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                flow.setConfirmExit(false);
                flow.close();
              }}
            >
              Keluar
            </Button>
            <ResponsiveAlertDialogAction
              onClick={() => {
                flow.setConfirmExit(false);
                void flow.handleApply();
              }}
            >
              Terapkan sekarang
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>

      <ResponsiveAlertDialog open={flow.confirmUndo} onOpenChange={flow.setConfirmUndo}>
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>Batalkan impor ini?</ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              Kembalikan profil &amp; CV ke kondisi sebelum impor. Perubahan yang
              kamu buat setelah impor akan hilang.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Batal</ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              onClick={() => {
                if (batchId) void flow.handleUndo(batchId);
              }}
            >
              Ya, batalkan
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </>
  );
}

function DoneStep({
  warnings,
  canUndo,
  onUndo,
  onClose,
}: {
  warnings: string[];
  canUndo: boolean;
  onUndo: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
        <p className="text-base font-medium text-foreground">
          Profil kamu diperbarui dari CV.
        </p>
      </div>

      {warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{warnings.length} hal dilewati</AlertTitle>
          <AlertDescription>
            <ul className="space-y-1">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Button asChild className="w-full bg-brand hover:bg-brand" onClick={onClose}>
          <Link href={ROUTES.dashboard.settings}>Lihat profil</Link>
        </Button>
        {canUndo && (
          <Button type="button" variant="outline" className="w-full gap-2" onClick={onUndo}>
            <Undo2 className="h-4 w-4" />
            Batalkan impor
          </Button>
        )}
        <Button type="button" variant="ghost" className="w-full" onClick={onClose}>
          Tutup
        </Button>
      </div>
    </div>
  );
}
