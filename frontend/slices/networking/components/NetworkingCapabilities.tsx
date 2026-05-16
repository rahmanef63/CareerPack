"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { subscribe } from "@/shared/lib/aiActionBus";
import { notify } from "@/shared/lib/notify";

type ContactRole = "recruiter" | "mentor" | "peer" | "other";

interface CreatePayload {
  name: string;
  role: string;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  notes?: string;
}

interface UpdatePayload extends Partial<CreatePayload> {
  contactId: string;
}

interface DeletePayload {
  contactId: string;
}

const VALID_ROLES: ContactRole[] = ["recruiter", "mentor", "peer", "other"];

function normaliseRole(raw: string | undefined): ContactRole {
  const r = (raw ?? "").toLowerCase().trim() as ContactRole;
  return VALID_ROLES.includes(r) ? r : "other";
}

export function NetworkingCapabilities() {
  const create = useMutation(api.contacts.mutations.createContact);
  const update = useMutation(api.contacts.mutations.updateContact);
  const remove = useMutation(api.contacts.mutations.deleteContact);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribe<CreatePayload>("contacts.create", async (a) => {
        const p = a.payload;
        const name = String(p.name ?? "").trim();
        if (!name) {
          notify.validation("Nama wajib diisi");
          return;
        }
        try {
          await create({
            name,
            role: normaliseRole(p.role),
            company: p.company ? String(p.company).trim() : undefined,
            position: p.position ? String(p.position).trim() : undefined,
            email: p.email ? String(p.email).trim() : undefined,
            phone: p.phone ? String(p.phone).trim() : undefined,
            linkedinUrl: p.linkedinUrl
              ? String(p.linkedinUrl).trim()
              : undefined,
            notes: p.notes ? String(p.notes).trim() : undefined,
          });
          notify.success(`Kontak ditambahkan: ${name}`);
        } catch (err) {
          notify.fromError(err, "Gagal tambah kontak");
        }
      }),
    );

    unsubs.push(
      subscribe<UpdatePayload>("contacts.update", async (a) => {
        const p = a.payload;
        const contactId = String(p.contactId ?? "").trim();
        if (!contactId) {
          notify.validation("ID kontak wajib");
          return;
        }
        const patch: Record<string, unknown> = {
          contactId: contactId as Id<"contacts">,
        };
        if (p.name !== undefined) patch.name = String(p.name).trim();
        if (p.role !== undefined) patch.role = normaliseRole(p.role);
        if (p.company !== undefined) patch.company = String(p.company).trim();
        if (p.position !== undefined)
          patch.position = String(p.position).trim();
        if (p.email !== undefined) patch.email = String(p.email).trim();
        if (p.phone !== undefined) patch.phone = String(p.phone).trim();
        if (p.linkedinUrl !== undefined)
          patch.linkedinUrl = String(p.linkedinUrl).trim();
        if (p.notes !== undefined) patch.notes = String(p.notes).trim();
        try {
          await update(patch as Parameters<typeof update>[0]);
          notify.success("Kontak diperbarui");
        } catch (err) {
          notify.fromError(err, "Gagal update kontak");
        }
      }),
    );

    unsubs.push(
      subscribe<DeletePayload>("contacts.delete", async (a) => {
        const id = String(a.payload.contactId ?? "").trim();
        if (!id) {
          notify.validation("ID kontak wajib");
          return;
        }
        try {
          await remove({ contactId: id as Id<"contacts"> });
          notify.success("Kontak dihapus");
        } catch (err) {
          notify.fromError(err, "Gagal hapus kontak");
        }
      }),
    );

    return () => {
      for (const u of unsubs) u();
    };
  }, [create, update, remove]);

  return null;
}
