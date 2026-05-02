import { ListChecks } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Document-checklist slice manifest — track required job-search docs
 * (CV, KTP, ijazah, dll). The list itself is seeded; AI usually just
 * toggles items as the user collects them.
 */
export const documentChecklistManifest: SliceManifest = {
  id: "document-checklist",
  label: "Ceklis Dokumen",
  description: "Status dokumen lamaran (CV, KTP, ijazah, dll)",
  icon: ListChecks,

  route: {
    slug: "checklist",
    component: () =>
      import("./components/DocumentChecklist").then((m) => ({
        default: m.DocumentChecklist,
      })),
  },

  nav: {
    placement: "more",
    order: 20,
    href: "/dashboard/checklist",
    hue: "from-emerald-400 to-emerald-600",
  },

  skills: [
    {
      id: "documents.list",
      label: "Lihat ceklis dokumen",
      description:
        "Ambil daftar item ceklis dokumen + status completed/notes/expiry. Pakai DULU sebelum toggle supaya dapat documentId.",
      kind: "query",
    },
    {
      id: "documents.toggle",
      label: "Tandai status dokumen",
      description:
        "Set status completed (true/false) untuk satu item ceklis. WAJIB documentId — panggil documents.list dulu. Optional notes + expiry (YYYY-MM-DD).",
      kind: "mutation",
      cta: "Simpan status",
      args: {
        documentId: { type: "string", label: "ID dokumen ceklis", required: true },
        completed: { type: "boolean", label: "Sudah punya?", required: true },
        notes: { type: "string", label: "Catatan", required: false },
        expiryDate: {
          type: "string",
          label: "Tanggal kedaluwarsa (YYYY-MM-DD)",
          required: false,
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
        },
      },
    },
  ],
};
