"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { visionSupport } from "../../../../convex/_shared/aiVision";
import { extractCv } from "@/shared/lib/cvExtract";
import { useFileUpload, validateFile } from "@/shared/hooks/useFileUpload";
import { notify } from "@/shared/lib/notify";
import type { AttachmentKind, MessageAttachment } from "../types/console";

/** Same cap as ai/actions.ts `MAX_ATTACHMENT_IMAGES` / the resume-import OCR
 *  flow — keeps the vision payload and the UI both bounded. */
export const MAX_CHAT_ATTACHMENTS = 3;

export interface PendingAttachment {
  id: string;
  fileName: string;
  kind: AttachmentKind;
  status: "processing" | "ready" | "error";
  /** Object URL for an instant preview — images only, revoked on removal. */
  previewUrl?: string;
  /** Set once the background upload to Convex storage finishes. Lets a
   *  reloaded session re-resolve a signed URL for this attachment. */
  storageId?: string;
  /** Vision data URL sent to the model THIS turn only (image kind). */
  visionUrl?: string;
  /** PDF text layer, inlined into the outgoing message (document kind). */
  extractedText?: string;
  /** Text layer looked unreliable (probably a scanned PDF) — extractedText
   *  may be thin or empty. Chat has no OCR-escalation UI (unlike CV import),
   *  so this just tells the user why the AI might not have "read" it. */
  scanned?: boolean;
  error?: string;
}

/**
 * Attach images / PDFs to an AI Agent Console turn. Deliberately simpler
 * than the CV importer's multi-phase OCR wizard (`useCvImportFlow`): chat
 * always spends one AI call regardless of what's attached, so there is no
 * "ask before this costs you a slot" gate to build — everything happens
 * as soon as a file is picked, best-effort, and gracefully degrades:
 *   - images  -> converted to WebP (imageConvert), sent as a vision content
 *                part IF the resolved model reads images (server has final
 *                say — this hook's `visionUncertain` is UX-only, never a hard
 *                block).
 *   - PDFs    -> text layer extracted client-side (free, model-agnostic) and
 *                inlined into the message; a scanned PDF is flagged, not
 *                rasterised (no OCR escalation here — see cvExtract.ts for
 *                that flow if this ever needs it).
 * Every attachment is also pushed to the user's Content Library via the same
 * `useFileUpload` upload path CV import uses, so a re-opened session can show
 * "you attached resume.pdf" even after the vision/text payload is gone.
 */
export function useChatAttachments() {
  const aiSettings = useQuery(api.ai.queries.getMyAISettings);
  // Optimistic when unknown (no per-user override => global/admin default is
  // in play, which this query can't see) — mirrors useCvImportFlow's
  // `visionUnverified`. The server is always the authoritative check.
  const visionUncertain =
    !!aiSettings &&
    aiSettings.enabled &&
    aiSettings.hasKey &&
    visionSupport(aiSettings.model) === "no";

  const { upload } = useFileUpload();
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const idRef = useRef(0);
  const previewUrls = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const urls = previewUrls.current;
    return () => {
      for (const url of urls.values()) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setPending((prev) => prev.filter((p) => p.id !== id));
    const url = previewUrls.current.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      previewUrls.current.delete(id);
    }
  }, []);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const incoming = Array.from(files);
      const room = MAX_CHAT_ATTACHMENTS - pending.length;
      if (room <= 0) {
        notify.warning(`Maksimal ${MAX_CHAT_ATTACHMENTS} lampiran per pesan`);
        return;
      }
      const accepted = incoming.slice(0, room);
      if (incoming.length > accepted.length) {
        notify.warning(`Maksimal ${MAX_CHAT_ATTACHMENTS} lampiran per pesan`);
      }

      // Build the new entries as a plain array first — the setState updater
      // below must stay pure (React can invoke it twice in Strict Mode dev),
      // so every side effect (object URLs, uploads) happens here instead,
      // exactly once per real file pick.
      const entries: Array<{ entry: PendingAttachment; file: File }> = [];
      for (const file of accepted) {
        const validation = validateFile(file);
        if (!validation.ok) {
          notify.error(validation.error);
          continue;
        }
        const id = `att-${++idRef.current}`;
        const kind: AttachmentKind = file.type.startsWith("image/")
          ? "image"
          : "document";
        const previewUrl =
          kind === "image" ? URL.createObjectURL(file) : undefined;
        if (previewUrl) previewUrls.current.set(id, previewUrl);
        entries.push({
          entry: { id, fileName: file.name, kind, status: "processing", previewUrl },
          file,
        });
      }
      if (entries.length === 0) return;

      setPending((prev) => [...prev, ...entries.map((e) => e.entry)]);

      // Fire and forget: extraction + upload run in the background per file
      // and patch that entry's status when done, so multiple attachments
      // process concurrently instead of serially.
      for (const { entry, file } of entries) {
        void (async () => {
          let patch: Partial<PendingAttachment> = {};
          try {
            const [extracted, uploaded] = await Promise.all([
              extractCv(file),
              upload(file),
            ]);
            if (!uploaded.ok) {
              throw new Error(uploaded.error);
            }
            patch =
              extracted.kind === "images"
                ? { visionUrl: extracted.pages?.[0] }
                : {
                    extractedText: extracted.text,
                    scanned: extracted.verdict !== "good",
                  };
            patch.storageId = uploaded.storageId;
            patch.status = "ready";
          } catch (e) {
            patch = {
              status: "error",
              error: e instanceof Error ? e.message : "Gagal memproses lampiran",
            };
          }
          setPending((prev) =>
            prev.map((p) => (p.id === entry.id ? { ...p, ...patch } : p)),
          );
        })();
      }
    },
    [pending, upload],
  );

  const reset = useCallback(() => {
    for (const url of previewUrls.current.values()) URL.revokeObjectURL(url);
    previewUrls.current.clear();
    setPending([]);
  }, []);

  /** Ready attachments only — anything still processing or failed is
   *  excluded from what actually gets sent. */
  const ready = pending.filter((p) => p.status === "ready");
  const busy = pending.some((p) => p.status === "processing");

  const buildForSend = useCallback((): {
    meta: MessageAttachment[];
    contentSuffix: string;
    visionUrls: string[];
  } => {
    const meta: MessageAttachment[] = ready.map((p) => ({
      kind: p.kind,
      fileName: p.fileName,
      storageId: p.storageId,
    }));
    const contentSuffix = ready
      .filter((p) => p.kind === "document")
      .map((p) => {
        const body = p.extractedText?.trim();
        // A scanned PDF's "text layer" is often a handful of ligature-junk
        // characters, not empty — assessExtraction's verdict is what
        // actually catches that, not a length check on its own.
        if (!body || (p.scanned && body.length < 40)) {
          return `\n\n[Lampiran: ${p.fileName} — tampaknya hasil scan, teks tidak dapat diekstrak otomatis]`;
        }
        return `\n\n[Lampiran: ${p.fileName}]\n${body}`;
      })
      .join("");
    const visionUrls = ready
      .filter((p) => p.kind === "image" && p.visionUrl)
      .map((p) => p.visionUrl!);
    return { meta, contentSuffix, visionUrls };
  }, [ready]);

  return {
    pending,
    ready,
    busy,
    visionUncertain,
    addFiles,
    removeAttachment,
    buildForSend,
    reset,
  };
}
