"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { subscribe } from "@/shared/lib/aiActionBus";
import { notify } from "@/shared/lib/notify";

interface SubmitFeedbackPayload {
  subject: string;
  message: string;
}

/**
 * Help capability binder — exposes feedback submission. Server
 * validates lengths (1-100 subject, 5-2000 message); we do the
 * shallow non-empty check client-side so we surface the friendlier
 * notify before the server throws.
 */
export function HelpCapabilities() {
  const submit = useMutation(api.feedback.mutations.submitFeedback);

  useEffect(() => {
    const unsub = subscribe<SubmitFeedbackPayload>(
      "help.submit-feedback",
      async (a) => {
        const subject = String(a.payload.subject ?? "").trim();
        const message = String(a.payload.message ?? "").trim();
        if (!subject) {
          notify.validation("Subjek wajib diisi");
          return;
        }
        if (message.length < 5) {
          notify.validation("Pesan minimal 5 karakter");
          return;
        }
        try {
          await submit({ subject, message });
          notify.success("Feedback terkirim — terima kasih!");
        } catch (err) {
          notify.fromError(err, "Gagal kirim feedback");
        }
      },
    );
    return unsub;
  }, [submit]);

  return null;
}
