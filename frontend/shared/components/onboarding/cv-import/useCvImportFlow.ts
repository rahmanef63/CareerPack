"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { visionSupport } from "../../../../../convex/_shared/aiVision";
import type { ParsedResume } from "../../../../../convex/_shared/resumeShape";
import { useIsDemo } from "@/shared/hooks/useDemoOverlay";
import {
  applyDecisions,
  buildMergePlan,
  hasChanges,
  isEmptyParse,
  type CurrentCV,
  type CurrentProfile,
  type MergePlan,
  type Side,
} from "@/shared/lib/cv-merge";
import { extractCv, rasterizePdfPages } from "@/shared/lib/cvExtract";
import { notify } from "@/shared/lib/notify";

/**
 * The import phase machine.
 *
 * **Call this from `CVImportDialog` and nowhere below it.** A hook keeps its
 * state in the fiber of the component that calls it, and `CVImportDialog` is
 * the last component above `<ResponsiveDialog>` — whose root swaps a radix
 * Dialog for a vaul Drawer at 1024 px and unmounts everything under it when it
 * does. `useIsMobile()` also starts out `undefined`, so a phone paints a
 * Dialog first and remounts as a Drawer one tick later. Moving this call into
 * a child would drop the whole import on both transitions.
 */

export type Phase =
  | "upload"
  | "extracting"
  | "parsing"
  | "review-text"
  | "summary"
  | "conflicts"
  | "confirm"
  | "applying"
  | "done";

export type SourceKind = "pdf-text" | "pdf-ocr" | "image" | "manual";

export interface Source {
  kind: SourceKind;
  name: string;
}

const SOURCE_TAG: Record<SourceKind, string> = {
  "pdf-text": "cv-import-pdf",
  "pdf-ocr": "cv-import-ocr",
  image: "cv-import-image",
  manual: "cv-import-manual",
};

/** Matches the dialog/drawer exit animation — resetting sooner flips the
 *  content back to the upload screen while it is still sliding away. */
const EXIT_MS = 300;
/** Long enough for the chosen block to finish highlighting, short enough that
 *  the card feels like it advanced on its own. */
const ADVANCE_MS = 180;

const stemOf = (name: string) => name.replace(/\.[^.]+$/, "");

export interface UseCvImportFlowOptions {
  onOpenChange: (open: boolean) => void;
  onApplied?: () => void;
}

export function useCvImportFlow({ onOpenChange, onApplied }: UseCvImportFlowOptions) {
  const me = useQuery(api.profile.queries.getCurrentUser);
  const cvs = useQuery(api.cv.queries.getUserCVs);
  const aiSettings = useQuery(api.ai.queries.getMyAISettings);
  const parseResume = useAction(api.ai.resume.parseResume);
  const applyCvImport = useMutation(api.onboarding.cvImport.applyCvImport);
  const undoBatch = useMutation(api.onboarding.mutations.undoBatch);
  const isDemo = useIsDemo();

  /** Both queries must have landed before anything can be planned. A loading
   *  `cvs` is indistinguishable from "this user has no CV", and planning
   *  against that creates a second CV instead of merging into the default —
   *  the exact duplicate the importer exists to avoid. */
  const ready = me !== undefined && cvs !== undefined;
  /** Per-user AI settings win credential resolution outright, so an enabled,
   *  keyed row names the model the parse will actually run on. A model outside
   *  the catalog may still read images — the server lets it through — so this
   *  warns instead of blocking. */
  const visionUnverified =
    !!aiSettings &&
    aiSettings.enabled &&
    aiSettings.hasKey &&
    visionSupport(aiSettings.model) === "unknown";

  const [phase, setPhase] = useState<Phase>("upload");
  const [source, setSource] = useState<Source | null>(null);
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [plan, setPlan] = useState<MergePlan | null>(null);
  const [decisions, setDecisions] = useState<Record<string, Side>>({});
  const [idx, setIdx] = useState(0);
  const [targetCvId, setTargetCvId] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<Id<"quickFillBatches"> | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [overwriteAll, setOverwriteAll] = useState(false);
  /** Which summary screen sits behind the spinner, so the write does not swap
   *  ③'s copy for ⑤'s halfway through. */
  const [applyFrom, setApplyFrom] = useState<"summary" | "confirm">("summary");
  const [manual, setManual] = useState(false);
  const [ocrOffer, setOcrOffer] = useState(false);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [progress, setProgress] = useState<{ page: number; total: number } | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  /** The picked file, kept only so the OCR escalation can re-read it. Not
   *  state: nothing renders from it and re-rendering on a pick is pointless. */
  const fileRef = useRef<File | null>(null);
  const advanceRef = useRef<number | null>(null);
  /** Bumped by every reset. Extraction and parsing can take 15 seconds, and
   *  without this a run that finishes after the user closed the dialog would
   *  install its plan anyway — reopening would land straight on a summary for
   *  a file they abandoned. */
  const runRef = useRef(0);

  const cancelAdvance = useCallback(() => {
    if (advanceRef.current !== null) {
      window.clearTimeout(advanceRef.current);
      advanceRef.current = null;
    }
  }, []);

  useEffect(() => cancelAdvance, [cancelAdvance]);

  const reset = useCallback(() => {
    cancelAdvance();
    runRef.current += 1;
    setPhase("upload");
    setSource(null);
    setRawText("");
    setParsed(null);
    setPlan(null);
    setDecisions({});
    setIdx(0);
    setTargetCvId(null);
    setBatchId(null);
    setConfirmExit(false);
    setConfirmUndo(false);
    setOverwriteAll(false);
    setApplyFrom("summary");
    setManual(false);
    setOcrOffer(false);
    setOcrRunning(false);
    setProgress(null);
    setWarnings([]);
    fileRef.current = null;
  }, [cancelAdvance]);

  const close = useCallback(() => {
    onOpenChange(false);
    window.setTimeout(reset, EXIT_MS);
  }, [onOpenChange, reset]);

  const cvChoices = useMemo(
    () => (cvs ?? []).map((cv) => ({ id: cv._id as string, title: cv.title })),
    [cvs],
  );

  const payload = useMemo(
    () => (plan ? applyDecisions(plan, decisions) : null),
    [plan, decisions],
  );

  /**
   * Build the plan from the values the queries hold *right now*, once, and
   * freeze it. Re-deriving it from `me` in an effect would let a live query
   * re-fire mid-review and snap the user's decisions back — the same failure
   * `OnboardingWizard` had when it re-hydrated its form from the profile.
   */
  const buildPlanFrom = useCallback(
    (resume: ParsedResume, cvId: string | null, fileStem: string) => {
      const list = cvs ?? [];
      const doc = cvId
        ? list.find((cv) => cv._id === cvId)
        : (list.find((cv) => cv.isDefault) ?? list[0]);
      const target: CurrentCV | null = doc
        ? {
            _id: doc._id,
            title: doc.title,
            personalInfo: doc.personalInfo,
            experience: doc.experience,
            education: doc.education,
            skills: doc.skills,
            certifications: doc.certifications,
            languages: doc.languages,
            projects: doc.projects,
          }
        : null;
      const profile: CurrentProfile | null = me?.profile
        ? {
            fullName: me.profile.fullName,
            phone: me.profile.phone,
            location: me.profile.location,
            targetRole: me.profile.targetRole,
            experienceLevel: me.profile.experienceLevel,
            bio: me.profile.bio,
            skills: me.profile.skills,
            interests: me.profile.interests,
          }
        : null;

      const next = buildMergePlan({
        profile,
        cv: target,
        accountEmail: me?.email,
        fileStem,
        parsed: resume,
      });

      cancelAdvance();
      setTargetCvId(target?._id ?? null);
      setPlan(next);
      setDecisions(Object.fromEntries(next.conflicts.map((c) => [c.id, "mine" as const])));
      setIdx(0);
      setOverwriteAll(false);
      setPhase("summary");
    },
    [cancelAdvance, cvs, me],
  );

  const runParse = useCallback(
    async (args: { text?: string; imagePages?: string[] }, next: Source) => {
      const run = runRef.current;
      setSource(next);
      setPhase("parsing");
      try {
        const resume = await parseResume(args);
        if (run !== runRef.current) return;
        setParsed(resume);
        if (isEmptyParse(resume)) {
          setPhase("review-text");
          return;
        }
        // A manual paste has no filename worth turning into a CV title.
        buildPlanFrom(resume, null, next.kind === "manual" ? "" : stemOf(next.name));
      } catch (err) {
        if (run !== runRef.current) return;
        notify.fromError(err, "Gagal membaca CV");
        setPhase(args.text ? "review-text" : "upload");
      } finally {
        if (run === runRef.current) setOcrRunning(false);
      }
    },
    [buildPlanFrom, parseResume],
  );

  const handleFile = useCallback(
    async (file: File) => {
      // Demo sessions read every screen from a localStorage overlay, so a
      // server write leaves the user staring at unchanged data. Gate here, at
      // the picker, before the upload and before any AI call is paid for.
      if (isDemo || !ready) return;
      const run = runRef.current;
      fileRef.current = file;
      setOcrOffer(false);
      setOcrRunning(false);
      setRawText("");
      setParsed(null);
      setPlan(null);
      setProgress(null);
      setPhase("extracting");
      try {
        const result = await extractCv(file, (page, total) => setProgress({ page, total }));
        if (run !== runRef.current) return;
        if (result.kind === "images") {
          await runParse({ imagePages: result.pages }, { kind: "image", name: file.name });
          return;
        }
        const text = result.text ?? "";
        setRawText(text);
        if (result.verdict === "good") {
          await runParse({ text }, { kind: "pdf-text", name: file.name });
          return;
        }
        setSource({ kind: "pdf-text", name: file.name });
        setOcrOffer(true);
        setPhase("upload");
      } catch (err) {
        if (run !== runRef.current) return;
        notify.fromError(err, "Gagal membaca file");
        setPhase("upload");
      } finally {
        if (run === runRef.current) setProgress(null);
      }
    },
    [isDemo, ready, runParse],
  );

  /** Never automatic: rasterising the pages costs the user an AI call. */
  const escalateOcr = useCallback(async () => {
    const file = fileRef.current;
    if (!file || isDemo || !ready) return;
    const run = runRef.current;
    setProgress(null);
    setOcrRunning(true);
    setPhase("extracting");
    try {
      const pages = await rasterizePdfPages(file, (page, total) => setProgress({ page, total }));
      if (run !== runRef.current) return;
      if (pages.length === 0) throw new Error("PDF ini tidak menghasilkan halaman yang bisa dibaca.");
      setOcrOffer(false);
      await runParse({ imagePages: pages }, { kind: "pdf-ocr", name: file.name });
    } catch (err) {
      if (run !== runRef.current) return;
      notify.fromError(err, "Gagal membaca PDF");
      setOcrRunning(false);
      setPhase("upload");
    } finally {
      if (run === runRef.current) setProgress(null);
    }
  }, [isDemo, ready, runParse]);

  const parseRawText = useCallback(() => {
    if (isDemo || !ready) return;
    const name = source?.name ?? "Teks tempel";
    const kind: SourceKind = source && source.kind !== "manual" ? source.kind : "manual";
    void runParse({ text: rawText }, { kind, name });
  }, [isDemo, ready, rawText, runParse, source]);

  const restart = useCallback(() => {
    setParsed(null);
    setRawText("");
    setPhase("upload");
  }, []);

  const dropPlan = useCallback(() => {
    cancelAdvance();
    setPlan(null);
    setParsed(null);
    setPhase("upload");
  }, [cancelAdvance]);

  const choose = useCallback(
    (id: string, side: Side) => {
      setDecisions((prev) => ({ ...prev, [id]: side }));
      const last = idx >= (plan?.conflicts.length ?? 0) - 1;
      cancelAdvance();
      advanceRef.current = window.setTimeout(() => {
        advanceRef.current = null;
        if (last) setPhase("confirm");
        else setIdx((current) => current + 1);
      }, ADVANCE_MS);
    },
    [cancelAdvance, idx, plan],
  );

  const navigate = useCallback(
    (next: number) => {
      cancelAdvance();
      setIdx(next);
    },
    [cancelAdvance],
  );

  const goTo = useCallback(
    (next: Phase) => {
      cancelAdvance();
      if (next === "conflicts") setIdx(0);
      setPhase(next);
    },
    [cancelAdvance],
  );

  const useAllFromCv = useCallback(() => {
    if (!plan) return;
    cancelAdvance();
    setDecisions(Object.fromEntries(plan.conflicts.map((c) => [c.id, "theirs" as const])));
    setOverwriteAll(true);
    setPhase("confirm");
  }, [cancelAdvance, plan]);

  const reanalyseFor = useCallback(
    (cvId: string) => {
      if (!parsed || !source) return;
      buildPlanFrom(parsed, cvId, source.kind === "manual" ? "" : stemOf(source.name));
    },
    [buildPlanFrom, parsed, source],
  );

  const handleUndo = useCallback(
    async (id: Id<"quickFillBatches">) => {
      try {
        await undoBatch({ batchId: id });
        notify.success("Impor dibatalkan — profil & CV kembali seperti sebelum impor");
        setConfirmUndo(false);
        onApplied?.();
        close();
      } catch (err) {
        notify.fromError(err, "Gagal membatalkan impor");
      }
    },
    [close, onApplied, undoBatch],
  );

  const handleApply = useCallback(async () => {
    if (!plan || !payload || !source) return;
    if (!hasChanges(payload)) {
      notify.info("Tidak ada perubahan — CV ini sudah sinkron dengan profil kamu.");
      close();
      return;
    }
    cancelAdvance();
    const run = runRef.current;
    // The pager can fire the apply too, so where a failure has to put the user
    // back is not the same as which summary copy sits behind the spinner.
    const origin = phase;
    setApplyFrom(phase === "summary" ? "summary" : "confirm");
    setPhase("applying");
    try {
      const result = await applyCvImport({
        profile: Object.keys(payload.profile).length > 0 ? payload.profile : undefined,
        profileExpect:
          Object.keys(payload.profileExpect).length > 0 ? payload.profileExpect : undefined,
        cvId: payload.cvId ? (payload.cvId as Id<"cvs">) : undefined,
        createCv: payload.createCv,
        cv: Object.keys(payload.cv).length > 0 ? (payload.cv as Record<string, unknown>) : undefined,
        cvExpect: Object.keys(payload.cvExpect).length > 0 ? payload.cvExpect : undefined,
        source: SOURCE_TAG[source.kind],
      });
      // The write landed, so the toast and `onApplied` fire even if the user
      // dismissed the dialog mid-flight — only the screen swap is skipped.
      if (run === runRef.current) {
        setBatchId(result.batchId);
        setWarnings(result.warnings ?? []);
        setPhase("done");
      }
      const undoId = result.batchId;
      if (undoId) {
        notify.action("Profil diperbarui dari CV", {
          actionLabel: "Urungkan",
          onAction: () => void handleUndo(undoId),
          kind: "success",
          duration: 12_000,
        });
      } else {
        // Nothing was written — offering "Urungkan" here would hand the user a
        // button that restores a snapshot identical to what is already stored.
        // The warnings explain why; usually every field drifted.
        notify.info("Tidak ada yang berubah — data kamu sudah sesuai CV ini.");
      }
      onApplied?.();
    } catch (err) {
      notify.fromError(err, "Gagal menyimpan impor");
      if (run === runRef.current) setPhase(origin);
    }
  }, [applyCvImport, cancelAdvance, close, handleUndo, onApplied, payload, phase, plan, source]);

  const requestClose = useCallback(() => {
    // Nothing is written before ③, so every earlier phase closes silently.
    if (phase === "conflicts" || phase === "confirm") {
      setConfirmExit(true);
      return;
    }
    close();
  }, [close, phase]);

  const conflicts = plan?.conflicts ?? [];
  const fromCv = conflicts.filter((c) => decisions[c.id] === "theirs").length;

  return {
    isDemo,
    ready,
    visionUnverified,
    phase,
    source,
    rawText,
    setRawText,
    plan,
    conflicts,
    decisions,
    idx,
    targetCvId,
    cvChoices,
    batchId,
    warnings,
    overwriteAll,
    applyFrom,
    manual,
    openManual: useCallback(() => setManual(true), []),
    ocrOffer,
    ocrRunning,
    progress,
    confirmExit,
    setConfirmExit,
    confirmUndo,
    setConfirmUndo,
    /** Additions + auto-merges + the differences resolved to the CV's value. */
    applyCount: plan ? plan.additions.length + plan.autoMerges.length + fromCv : 0,
    handleFile,
    escalateOcr,
    parseRawText,
    restart,
    dropPlan,
    choose,
    navigate,
    goTo,
    useAllFromCv,
    reanalyseFor,
    handleApply,
    handleUndo,
    requestClose,
    close,
  };
}
