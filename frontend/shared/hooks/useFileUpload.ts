"use client";

import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  convertImageToWebP,
  isConvertibleImage,
  CONVERTIBLE_IMAGE_TYPES,
  MAX_CONVERT_BYTES,
  MAX_DOC_BYTES,
} from "../lib/imageConvert";

/**
 * POST a File to a Convex-minted upload URL via XMLHttpRequest instead
 * of fetch — fetch's Response doesn't expose upload progress for the
 * request body, but XHR's `upload.onprogress` fires for every chunk.
 * Used to drive the progress indicator in the <FileUpload> component
 * (matters most for 50 MB PDFs where the upload is the slow step).
 */
function xhrUpload(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ storageId: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText) as { storageId?: unknown };
          if (typeof parsed.storageId !== "string") {
            reject(new Error("Respons upload tidak valid"));
            return;
          }
          resolve({ storageId: parsed.storageId });
        } catch {
          reject(new Error("Respons upload tidak valid"));
        }
      } else {
        reject(new Error(`Unggah gagal (HTTP ${xhr.status})`));
      }
    });
    xhr.addEventListener("error", () =>
      reject(new Error("Unggah gagal: koneksi terputus")),
    );
    xhr.addEventListener("abort", () =>
      reject(new Error("Unggah dibatalkan")),
    );
    xhr.send(file);
  });
}

// What the user can PICK client-side. Image types come from
// shared/lib/imageConvert.ts (single source). Images get converted to
// WebP before upload (see convertImageToWebP); PDFs pass through.
// The server storage whitelist is stricter — image/webp +
// application/pdf only — so unconverted JPEG/PNG/etc. can never land
// in blob storage even if a malicious client skips the hook.
export const ALLOWED_IMAGE_TYPES = CONVERTIBLE_IMAGE_TYPES;
export const ALLOWED_DOC_TYPES = ["application/pdf"] as const;
export const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];

/** Re-export for backward-compat with callers expecting the old name.
 *  Canonical source: MAX_CONVERT_BYTES in shared/lib/imageConvert.ts. */
export const MAX_IMAGE_BYTES = MAX_CONVERT_BYTES;
export { MAX_DOC_BYTES };

export type UploadResult =
  | {
      ok: true;
      storageId: string;
      fileId: Id<"files">;
      fileName: string;
      fileType: string;
      fileSize: number;
      /** Bytes of the file the user picked (pre-convert). Equals fileSize
       *  when no conversion happened (PDF or already-webp). */
      originalSize: number;
    }
  | { ok: false; error: string };

function isImage(type: string): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}
function isDoc(type: string): boolean {
  return (ALLOWED_DOC_TYPES as readonly string[]).includes(type);
}

export function validateFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!file.type) {
    return { ok: false, error: "Tipe file tidak terdeteksi" };
  }
  if (!isImage(file.type) && !isDoc(file.type)) {
    return {
      ok: false,
      error: "Tipe file tidak didukung. Hanya JPEG, PNG, WebP, atau PDF.",
    };
  }
  if (isImage(file.type) && file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Gambar terlalu besar (maks 10 MB)" };
  }
  if (isDoc(file.type) && file.size > MAX_DOC_BYTES) {
    return { ok: false, error: "Dokumen terlalu besar (maks 50 MB)" };
  }
  if (file.size <= 0) {
    return { ok: false, error: "File kosong" };
  }
  return { ok: true };
}

/**
 * Upload a file to Convex's built-in blob storage. Three-step flow:
 *   1. Mint a short-lived upload URL via `generateUploadUrl`.
 *   2. POST file bytes directly to that URL (same-origin from the
 *      Convex deployment's perspective; this is the canonical Convex
 *      upload pattern and is exempt from R12's "no external fetch"
 *      rule because the URL is server-minted and tokenized).
 *   3. Persist metadata via `saveFile` so the blob is discoverable
 *      and ownership-checkable later.
 *
 * `uploadedBy` is NOT a parameter — the mutation derives the user id
 * from the authenticated session. Client-supplied identity would allow
 * cross-tenant impersonation.
 */
export function useFileUpload() {
  const generateUploadUrl = useMutation(api.files.mutations.generateUploadUrl);
  const saveFile = useMutation(api.files.mutations.saveFile);

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageId, setStorageId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const upload = useCallback(
    async (file: File): Promise<UploadResult> => {
      const validation = validateFile(file);
      if (!validation.ok) {
        setError(validation.error);
        return validation;
      }

      setError(null);
      setStorageId(null);
      setProgress(0);
      setIsUploading(true);

      const originalSize = file.size;
      let toUpload = file;

      try {
        // Convert raster images to WebP before upload. PDFs bypass this
        // step. Conversion throws (Indonesian) if the browser can't
        // decode or the file is >10 MB. Always re-encodes to strip EXIF.
        if (isConvertibleImage(file.type)) {
          toUpload = await convertImageToWebP(file);
        }

        const uploadUrl = await generateUploadUrl();
        const { storageId: sid } = await xhrUpload(
          uploadUrl,
          toUpload,
          setProgress,
        );

        const fileId = await saveFile({
          storageId: sid,
          fileName: toUpload.name,
          fileType: toUpload.type,
          fileSize: toUpload.size,
        });

        setStorageId(sid);
        return {
          ok: true,
          storageId: sid,
          fileId,
          fileName: toUpload.name,
          fileType: toUpload.type,
          fileSize: toUpload.size,
          originalSize,
        };
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message.replace(/^\[Request ID:[^\]]+\]\s*/, "").split("\n")[0]
            : "Unggah gagal";
        setError(msg);
        return { ok: false, error: msg };
      } finally {
        setIsUploading(false);
      }
    },
    [generateUploadUrl, saveFile],
  );

  const reset = useCallback(() => {
    setError(null);
    setStorageId(null);
    setProgress(0);
    setIsUploading(false);
  }, []);

  return { upload, isUploading, error, storageId, progress, reset };
}

// formatFileSize re-exported from SSoT — keeps existing callers
// (FileUpload component) importing `from "@/shared/hooks/useFileUpload"`
// working without churn, while the actual implementation lives once
// at shared/lib/formatFileSize.ts.
export { formatFileSize } from "@/shared/lib/formatFileSize";
