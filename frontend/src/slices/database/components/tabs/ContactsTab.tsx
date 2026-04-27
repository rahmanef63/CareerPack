"use client";

import { api } from "../../../../../../convex/_generated/api";
import type { Doc } from "../../../../../../convex/_generated/dataModel";
import type { ColumnDef, FilterDef } from "@/shared/components/data-table";
import { Badge } from "@/shared/components/ui/badge";
import { defineResource } from "../../lib/defineResource";

type Contact = Doc<"contacts">;

const columns: ReadonlyArray<ColumnDef<Contact>> = [
  { id: "name", header: "Nama", accessor: (r) => r.name },
  {
    id: "role",
    header: "Peran",
    accessor: (r) => r.role,
    cell: (r) => <Badge variant="outline">{r.role}</Badge>,
  },
  { id: "company", header: "Perusahaan", accessor: (r) => r.company ?? null },
  { id: "email", header: "Email", accessor: (r) => r.email ?? null, hideOnMobile: true },
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

export const ContactsTab = defineResource<Contact>({
  query: api.contacts.queries.listContacts,
  bulkDelete: api.contacts.mutations.bulkDeleteContacts,
  quickFill: api.onboarding.mutations.quickFill,
  resourceLabel: "kontak",
  exportPrefix: "contacts",
  columns,
  filters,
  rowKey: (r) => r._id,
  searchAccessor: (r) =>
    `${r.name} ${r.company ?? ""} ${r.position ?? ""} ${r.email ?? ""} ${r.role}`,
  searchPlaceholder: "Cari kontak…",
  emptyMessage: "Belum ada kontak.",
  importConfig: {
    wrapperKey: "contacts",
    mode: "array",
    scope: "contacts",
    formatSuccess: (res) =>
      `${res.contacts.added} kontak ditambahkan${
        res.contacts.skipped > 0 ? ` (${res.contacts.skipped} dilewati)` : ""
      }.`,
  },
});
