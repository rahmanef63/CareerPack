"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { subscribe } from "@/shared/lib/aiActionBus";
import { notify } from "@/shared/lib/notify";

interface DeleteSessionPayload {
  interviewId: string;
}

/**
 * Mock-interview capability binder — only mutation skill is delete.
 * Queries (`list-sessions`, `get-analytics`) are handled server-side
 * by skillHandlers. Session creation stays in the slice UI to avoid
 * forcing the AI to generate a 50-question payload upfront.
 */
export function InterviewCapabilities() {
  const deleteInterview = useMutation(
    api.mockInterview.mutations.deleteInterview,
  );

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribe<DeleteSessionPayload>(
        "interview.delete-session",
        async (a) => {
          const interviewId = String(a.payload.interviewId ?? "").trim();
          if (!interviewId) {
            notify.validation("interviewId wajib");
            return;
          }
          try {
            await deleteInterview({
              interviewId: interviewId as Id<"mockInterviews">,
            });
            notify.success("Sesi wawancara dihapus");
          } catch (err) {
            notify.fromError(err, "Gagal hapus sesi");
          }
        },
      ),
    );

    return () => {
      for (const u of unsubs) u();
    };
  }, [deleteInterview]);

  return null;
}
