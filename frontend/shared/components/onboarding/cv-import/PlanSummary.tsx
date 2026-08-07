"use client";

import type { ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  FilePlus2,
  FileText,
  Info,
  Loader2,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import type { MergePlan, Note, Side } from "@/shared/lib/cv-merge";

export interface CvChoice {
  id: string;
  title: string;
}

export interface PlanSummaryProps {
  /** ③ before the pager, ⑤ after it (or after "Pakai semua dari CV"). */
  mode: "summary" | "confirm";
  plan: MergePlan;
  decisions: Record<string, Side>;
  /** Existing CVs the import can be merged into. Empty ⇒ a CV is created. */
  cvChoices: CvChoice[];
  targetCvId: string | null;
  onSelectCv: (cvId: string) => void;
  /** The user asked for every difference to take the CV's value. */
  overwriteAll: boolean;
  applying: boolean;
  onApply: () => void;
  onReview: () => void;
  onUseAll: () => void;
  onBack: () => void;
  onClose: () => void;
}

/**
 * Screens ③ Ringkasan and ⑤ Konfirmasi.
 *
 * ③ is the screen the whole feature is judged on: the headline count is the
 * additions only, so the one visible tap can add but never overwrite. Taking
 * the CV's value over your own is always a second, labelled action.
 */
export function PlanSummary({
  mode,
  plan,
  decisions,
  cvChoices,
  targetCvId,
  onSelectCv,
  overwriteAll,
  applying,
  onApply,
  onReview,
  onUseAll,
  onBack,
  onClose,
}: PlanSummaryProps) {
  const added = plan.additions.length + plan.autoMerges.length;
  const conflicts = plan.conflicts.length;
  const found = added + conflicts;
  const fromCv = plan.conflicts.filter((c) => decisions[c.id] === "theirs").length;
  const kept = conflicts - fromCv;
  const applyCount = added + fromCv;

  if (found === 0) {
    return (
      <div className="space-y-4">
        <Alert>
          <Check className="h-4 w-4" />
          <AlertTitle>Semua sudah sinkron</AlertTitle>
          <AlertDescription>
            Tidak ada perubahan — CV ini sudah sinkron dengan profil kamu.
          </AlertDescription>
        </Alert>
        <IgnoredList notes={plan.ignored} />
        <Button type="button" variant="outline" className="w-full" onClick={onClose}>
          Tutup
        </Button>
      </div>
    );
  }

  if (mode === "confirm") {
    return (
      <div className="space-y-4">
        <p className="text-base leading-relaxed text-foreground">
          Siap disimpan: <strong>{added} ditambahkan</strong> ·{" "}
          <strong>{fromCv} diganti dengan versi CV</strong> ·{" "}
          <strong>{kept} dipertahankan</strong>.
        </p>

        {overwriteAll && fromCv > 0 && (
          <Alert>
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Semua perbedaan memakai nilai dari CV</AlertTitle>
            <AlertDescription>
              {fromCv} nilai yang sudah ada akan ditimpa. Tinjau satu per satu
              kalau mau memilih sendiri.
            </AlertDescription>
          </Alert>
        )}

        {/* Read-only here: switching the target re-plans against a different
            document, which would discard the decisions just made. */}
        <TargetLine
          createCv={plan.draft.createCv}
          title={plan.draft.cv.title}
          cvChoices={cvChoices}
          targetCvId={targetCvId}
          onSelectCv={onSelectCv}
          editable={false}
        />

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            className="w-full gap-2 bg-brand hover:bg-brand"
            disabled={applying}
            onClick={onApply}
          >
            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Simpan ke profil
          </Button>
          {conflicts > 0 && (
            <Button type="button" variant="ghost" className="w-full gap-2" onClick={onReview}>
              <ArrowLeft className="h-4 w-4" />
              Tinjau lagi {conflicts} perbedaan
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-base font-medium text-foreground">
        Kami menemukan {found} hal dari CV kamu.
      </p>

      <div className="space-y-1.5">
        <Row
          icon={<Check className="h-4 w-4 text-success" aria-hidden />}
          label={`${added} ditambahkan otomatis`}
          notes={[...plan.additions, ...plan.autoMerges]}
        />
        {conflicts > 0 && (
          <Row
            icon={<TriangleAlert className="h-4 w-4 text-warning" aria-hidden />}
            label={`${conflicts} perbedaan — nilai kamu dipertahankan`}
            notes={plan.conflicts.map((c) => ({
              id: c.id,
              group: c.group,
              label: c.sublabel ? `${c.label} — ${c.sublabel}` : c.label,
            }))}
          />
        )}
        {plan.ignored.length > 0 && (
          <Row
            icon={<RotateCcw className="h-4 w-4 text-muted-foreground" aria-hidden />}
            label={`${plan.ignored.length} dilewati`}
            notes={plan.ignored}
          />
        )}
      </div>

      <TargetLine
        createCv={plan.draft.createCv}
        title={plan.draft.cv.title}
        cvChoices={cvChoices}
        targetCvId={targetCvId}
        onSelectCv={onSelectCv}
        editable
      />

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          className="w-full gap-2 bg-brand hover:bg-brand"
          disabled={applying}
          onClick={onApply}
        >
          {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {conflicts > 0 ? `Terapkan ${applyCount} perubahan` : "Simpan ke profil"}
        </Button>
        {conflicts > 0 && (
          <>
            <p className="text-center text-xs text-muted-foreground">
              {kept} perbedaan dipertahankan pakai nilai kamu.
            </p>
            <Button type="button" variant="ghost" className="w-full" onClick={onReview}>
              Tinjau {conflicts} perbedaan satu per satu
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={onUseAll}>
              Pakai semua dari CV
            </Button>
          </>
        )}
      </div>

      <Button type="button" variant="ghost" size="sm" className="w-full" onClick={onBack}>
        Ganti file
      </Button>
    </div>
  );
}

function TargetLine({
  createCv,
  title,
  cvChoices,
  targetCvId,
  onSelectCv,
  editable,
}: {
  createCv: boolean;
  title: string | undefined;
  cvChoices: CvChoice[];
  targetCvId: string | null;
  onSelectCv: (cvId: string) => void;
  editable: boolean;
}) {
  if (createCv || cvChoices.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <FilePlus2 className="h-4 w-4 shrink-0 text-brand" aria-hidden />
        CV baru akan dibuat: <strong className="text-foreground">{title ?? "CV Impor"}</strong>
      </p>
    );
  }
  if (!editable) {
    const chosen = cvChoices.find((cv) => cv.id === targetCvId);
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4 shrink-0 text-brand" aria-hidden />
        Digabung ke:{" "}
        <strong className="text-foreground">{chosen?.title ?? "CV Utama"}</strong>
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">Digabung ke:</span>
      <div className="min-w-40 flex-1">
        <ResponsiveSelect value={targetCvId ?? undefined} onValueChange={onSelectCv}>
          <ResponsiveSelectTrigger placeholder="Pilih CV…" />
          <ResponsiveSelectContent drawerTitle="Gabungkan ke CV mana?">
            {cvChoices.map((cv) => (
              <ResponsiveSelectItem key={cv.id} value={cv.id}>
                {cv.title}
              </ResponsiveSelectItem>
            ))}
          </ResponsiveSelectContent>
        </ResponsiveSelect>
      </div>
    </div>
  );
}

/** Native `<details>` on purpose: the disclosure carries no import state, so
 *  it must not add anything the dialog has to own and reset. */
function Row({
  icon,
  label,
  notes,
}: {
  icon: ReactNode;
  label: string;
  notes: Note[];
}) {
  if (notes.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm">
        {icon}
        <span>{label}</span>
      </div>
    );
  }
  return (
    <details className="group rounded-lg border border-border bg-muted/20">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm">
        {icon}
        <span className="flex-1">{label}</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <ul className="space-y-1 border-t border-border px-3 py-2 text-xs text-muted-foreground">
        {notes.map((note) => (
          <li key={note.id}>
            <span className="font-medium text-foreground">{note.label}</span>
            {note.detail && <span> — {note.detail}</span>}
          </li>
        ))}
      </ul>
    </details>
  );
}

function IgnoredList({ notes }: { notes: Note[] }) {
  if (notes.length === 0) return null;
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>{notes.length} nilai dilewati</AlertTitle>
      <AlertDescription>
        <ul className="space-y-1">
          {notes.map((note) => (
            <li key={note.id}>
              <span className="font-medium">{note.label}</span>
              {note.detail && <span> — {note.detail}</span>}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
