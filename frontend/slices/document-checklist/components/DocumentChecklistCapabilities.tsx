"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { subscribe } from "@/shared/lib/aiActionBus";
import { notify } from "@/shared/lib/notify";

interface TogglePayload {
  documentId: string;
  completed: boolean;
  notes?: string;
  expiryDate?: string;
}

export function DocumentChecklistCapabilities() {
  const updateStatus = useMutation(
    api.documents.mutations.updateDocumentStatus,
  );

  useEffect(() => {
    const unsub = subscribe<TogglePayload>("documents.toggle", async (a) => {
      const p = a.payload;
      const documentId = String(p.documentId ?? "").trim();
      if (!documentId) {
        notify.validation("ID dokumen wajib");
        return;
      }
      const completed = Boolean(p.completed);
      const expiry = p.expiryDate ? String(p.expiryDate).trim() : undefined;
      if (expiry && !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
        notify.validation(
          `Format tanggal kedaluwarsa tidak valid: ${expiry}`,
        );
        return;
      }
      try {
        await updateStatus({
          documentId,
          completed,
          notes: p.notes ? String(p.notes).trim() : undefined,
          expiryDate: expiry,
        });
        notify.success(
          `Dokumen ditandai ${completed ? "selesai" : "belum selesai"}`,
        );
      } catch (err) {
        notify.fromError(err, "Gagal update dokumen");
      }
    });
    return unsub;
  }, [updateStatus]);

  return null;
}
