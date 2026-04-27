"use client";

import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../../convex/_generated/dataModel";
import type { ColumnDef, FilterDef } from "@/shared/components/data-table";
import { Badge } from "@/shared/components/ui/badge";
import { ResourceTable } from "../ResourceTable";

type Contact = Doc<"contacts">;

const columns: ReadonlyArray<ColumnDef<Contact>> = [
  {
    id: "name",
    header: "Nama",
    accessor: (r) => r.name,
  },
  {
    id: "role",
    header: "Peran",
    accessor: (r) => r.role,
    cell: (r) => <Badge variant="outline">{r.role}</Badge>,
  },
  {
    id: "company",
    header: "Perusahaan",
    accessor: (r) => r.company ?? null,
  },
  {
    id: "email",
    header: "Email",
    accessor: (r) => r.email ?? null,
    hideOnMobile: true,
  },
  {
    id: "favorite",
    header: "Favorit",
    accessor: (r) => Boolean(r.favorite),
    align: "center",
    hideOnMobile: true,
  },
  {
    id: "lastInteraction",
    header: "Terakhir",
    accessor: (r) => (r.lastInteraction ? new Date(r.lastInteraction) : null),
    cell: (r) =>
      r.lastInteraction
        ? new Date(r.lastInteraction).toLocaleDateString("id-ID")
        : "—",
  },
];

const filters: ReadonlyArray<FilterDef<Contact>> = [
  {
    id: "role",
    label: "Peran",
    accessor: (r) => r.role,
    options: [
      { value: "recruiter", label: "Recruiter" },
      { value: "mentor", label: "Mentor" },
      { value: "peer", label: "Peer" },
      { value: "other", label: "Lainnya" },
    ],
  },
];

export function ContactsTab() {
  const data = useQuery(api.contacts.queries.listContacts);
  const bulkDelete = useMutation(api.contacts.mutations.bulkDeleteContacts);
  const quickFill = useMutation(api.onboarding.mutations.quickFill);

  return (
    <ResourceTable<Contact>
      data={data}
      isLoading={data === undefined}
      columns={columns}
      filters={filters}
      rowKey={(r) => r._id}
      searchAccessor={(r) =>
        `${r.name} ${r.company ?? ""} ${r.position ?? ""} ${r.email ?? ""} ${r.role}`
      }
      searchPlaceholder="Cari kontak…"
      resourceLabel="kontak"
      exportPrefix="contacts"
      exportShape={({ _id: _i, _creationTime: _t, userId: _u, ...rest }) => rest}
      onBulkDelete={async (ids) =>
        bulkDelete({ contactIds: ids as Id<"contacts">[] })
      }
      onImport={async (parsed) => {
        const contacts = Array.isArray(parsed)
          ? parsed
          : isContactsWrapper(parsed)
            ? parsed.contacts
            : null;
        if (!contacts) {
          toast.error("Format tidak dikenali — array atau `{ contacts: [...] }`.");
          return;
        }
        const res = await quickFill({ payload: { contacts }, scope: "contacts" });
        toast.success(
          `${res.contacts.added} kontak ditambahkan${
            res.contacts.skipped > 0 ? ` (${res.contacts.skipped} dilewati)` : ""
          }.`,
        );
      }}
      emptyMessage="Belum ada kontak."
    />
  );
}

function isContactsWrapper(v: unknown): v is { contacts: unknown[] } {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return Array.isArray(obj.contacts);
}
