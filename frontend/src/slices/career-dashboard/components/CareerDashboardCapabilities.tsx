"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { subscribe } from "@/shared/lib/aiActionBus";
import { notify } from "@/shared/lib/notify";

interface CreatePayload {
  company: string;
  position: string;
  location: string;
  source: string;
  salary?: string;
  notes?: string;
}

interface UpdateStatusPayload {
  applicationId: string;
  status: string;
  notes?: string;
}

interface DeletePayload {
  applicationId: string;
}

const VALID_STATUS = new Set([
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "accepted",
]);

export function CareerDashboardCapabilities() {
  const create = useMutation(api.applications.mutations.createApplication);
  const updateStatus = useMutation(
    api.applications.mutations.updateApplicationStatus,
  );
  const remove = useMutation(api.applications.mutations.deleteApplication);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribe<CreatePayload>("applications.create", async (a) => {
        const p = a.payload;
        const company = String(p.company ?? "").trim();
        const position = String(p.position ?? "").trim();
        const location = String(p.location ?? "").trim();
        const source = String(p.source ?? "").trim();
        if (!company || !position || !location || !source) {
          notify.validation("Company, posisi, lokasi, sumber wajib diisi");
          return;
        }
        try {
          await create({
            company,
            position,
            location,
            source,
            salary: p.salary ? String(p.salary).trim() : undefined,
            notes: p.notes ? String(p.notes).trim() : undefined,
          });
          notify.success(`Lamaran ditambahkan: ${position} @ ${company}`);
        } catch (err) {
          notify.fromError(err, "Gagal tambah lamaran");
        }
      }),
    );

    unsubs.push(
      subscribe<UpdateStatusPayload>(
        "applications.update-status",
        async (a) => {
          const p = a.payload;
          const applicationId = String(p.applicationId ?? "").trim();
          const status = String(p.status ?? "").toLowerCase().trim();
          if (!applicationId) {
            notify.validation("ID lamaran wajib");
            return;
          }
          if (!VALID_STATUS.has(status)) {
            notify.validation(
              `Status tidak valid: ${status}. Valid: ${[...VALID_STATUS].join(", ")}`,
            );
            return;
          }
          try {
            await updateStatus({
              applicationId: applicationId as Id<"jobApplications">,
              status,
              notes: p.notes ? String(p.notes).trim() : undefined,
            });
            notify.success(`Status lamaran diubah ke: ${status}`);
          } catch (err) {
            notify.fromError(err, "Gagal update status lamaran");
          }
        },
      ),
    );

    unsubs.push(
      subscribe<DeletePayload>("applications.delete", async (a) => {
        const id = String(a.payload.applicationId ?? "").trim();
        if (!id) {
          notify.validation("ID lamaran wajib");
          return;
        }
        try {
          await remove({ applicationId: id as Id<"jobApplications"> });
          notify.success("Lamaran dihapus");
        } catch (err) {
          notify.fromError(err, "Gagal hapus lamaran");
        }
      }),
    );

    return () => {
      for (const u of unsubs) u();
    };
  }, [create, updateStatus, remove]);

  return null;
}
