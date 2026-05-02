"use client";

import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id, Doc } from "../../../../convex/_generated/dataModel";
import { useAuth } from "@/shared/hooks/useAuth";
import { withMutationToast } from "@/shared/lib/notify";
import type { Application, ApplicationStatus } from "@/shared/types";

type ConvexApplication = Doc<"jobApplications">;

function fromConvex(doc: ConvexApplication): Application {
  return {
    id: doc._id,
    company: doc.company,
    position: doc.position,
    status: doc.status as ApplicationStatus,
    appliedDate: new Date(doc.appliedDate).toISOString().split("T")[0],
    lastUpdate: new Date(doc._creationTime).toISOString().split("T")[0],
    notes: doc.notes,
    salary: doc.salary,
  };
}

export interface CreateApplicationInput {
  company: string;
  position: string;
  location?: string;
  salary?: string;
  source?: string;
  notes?: string;
}

export function useApplications() {
  const { state } = useAuth();
  const isAuthenticated = state.isAuthenticated;

  const raw = useQuery(
    api.applications.queries.getUserApplications,
    isAuthenticated ? {} : "skip",
  );
  const createMutation = useMutation(api.applications.mutations.createApplication);
  const updateStatusMutation = useMutation(
    api.applications.mutations.updateApplicationStatus,
  );
  const deleteMutation = useMutation(api.applications.mutations.deleteApplication);

  const applications: Application[] = raw ? raw.map(fromConvex) : [];

  // Each wrapper toasts on failure + re-throws so callers that need to
  // gate UI on success (close dialog, reset form) can still `await`.
  // Success toasts stay at the call site — the message is contextual
  // (e.g. "Status diubah ke Wawancara") and can't be statically named
  // here.
  const create = useCallback(
    async (input: CreateApplicationInput) => {
      await withMutationToast(
        () =>
          createMutation({
            company: input.company,
            position: input.position,
            location: input.location ?? "",
            salary: input.salary,
            source: input.source ?? "Website perusahaan",
            notes: input.notes,
          }),
        { error: "Gagal menambahkan lamaran" },
      );
    },
    [createMutation],
  );

  const updateStatus = useCallback(
    async (id: string, status: ApplicationStatus, notes?: string) => {
      await withMutationToast(
        () =>
          updateStatusMutation({
            applicationId: id as Id<"jobApplications">,
            status,
            notes,
          }),
        { error: "Gagal mengubah status lamaran" },
      );
    },
    [updateStatusMutation],
  );

  const remove = useCallback(
    async (id: string) => {
      await withMutationToast(
        () => deleteMutation({ applicationId: id as Id<"jobApplications"> }),
        { error: "Gagal menghapus lamaran" },
      );
    },
    [deleteMutation],
  );

  return {
    applications,
    isLoading: isAuthenticated && raw === undefined,
    create,
    updateStatus,
    remove,
  };
}
