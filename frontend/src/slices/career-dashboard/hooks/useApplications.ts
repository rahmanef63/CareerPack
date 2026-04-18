"use client";

import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id, Doc } from "../../../../../convex/_generated/dataModel";
import { useAuth } from "@/shared/hooks/useAuth";
import type { Application, ApplicationStatus } from "../types";

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
    api.applications.getUserApplications,
    isAuthenticated ? {} : "skip"
  );
  const createMutation = useMutation(api.applications.createApplication);
  const updateStatusMutation = useMutation(
    api.applications.updateApplicationStatus
  );
  const deleteMutation = useMutation(api.applications.deleteApplication);

  const applications: Application[] = raw ? raw.map(fromConvex) : [];

  const create = useCallback(
    async (input: CreateApplicationInput) => {
      await createMutation({
        company: input.company,
        position: input.position,
        location: input.location ?? "",
        salary: input.salary,
        source: input.source ?? "Website perusahaan",
        notes: input.notes,
      });
    },
    [createMutation]
  );

  const updateStatus = useCallback(
    async (id: string, status: ApplicationStatus, notes?: string) => {
      await updateStatusMutation({
        applicationId: id as Id<"jobApplications">,
        status,
        notes,
      });
    },
    [updateStatusMutation]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteMutation({ applicationId: id as Id<"jobApplications"> });
    },
    [deleteMutation]
  );

  return {
    applications,
    isLoading: isAuthenticated && raw === undefined,
    create,
    updateStatus,
    remove,
  };
}
