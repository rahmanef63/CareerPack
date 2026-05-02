import { Briefcase } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Career-dashboard slice manifest — owns the `jobApplications` table
 * (CRUD + status tracking). AI skills cover the typical loop: list →
 * pick by company/role → update status / delete.
 *
 * Status values follow the existing UI taxonomy: `applied`,
 * `screening`, `interview`, `offer`, `rejected`, `accepted`.
 */
export const careerDashboardManifest: SliceManifest = {
  id: "career-dashboard",
  label: "Lamaran",
  description: "Tracker lamaran kerja end-to-end",
  icon: Briefcase,

  route: {
    slug: "applications",
    component: () =>
      import("./components/CareerDashboard").then((m) => ({
        default: m.CareerDashboard,
      })),
  },

  nav: {
    placement: "more",
    order: 10,
    href: "/dashboard/applications",
    hue: "from-violet-400 to-violet-600",
  },

  skills: [
    {
      id: "applications.list",
      label: "Lihat lamaran kerja",
      description:
        "Ambil daftar semua lamaran user (perusahaan, posisi, status, tanggal). Pakai DULU sebelum update/delete supaya dapat applicationId. Juga untuk menjawab 'berapa lamaran saya', 'apa status lamaran X', dst.",
      kind: "query",
    },
    {
      id: "applications.create",
      label: "Tambah lamaran baru",
      description:
        "Catat lamaran kerja baru. WAJIB punya company, position, location, dan source (LinkedIn/JobStreet/website/referral/dll).",
      kind: "compose",
      cta: "Simpan lamaran",
      args: {
        company: { type: "string", label: "Nama perusahaan", required: true, example: "Tokopedia" },
        position: { type: "string", label: "Posisi yang dilamar", required: true, example: "Frontend Engineer" },
        location: { type: "string", label: "Lokasi", required: true, example: "Jakarta" },
        source: { type: "string", label: "Sumber (LinkedIn/JobStreet/Referral/dst)", required: true, example: "LinkedIn" },
        salary: { type: "string", label: "Range gaji", required: false, example: "10-15 juta" },
        notes: { type: "string", label: "Catatan", required: false },
      },
    },
    {
      id: "applications.update-status",
      label: "Update status lamaran",
      description:
        "Ubah status lamaran yang sudah ada (mis. dari 'applied' ke 'interview'). WAJIB applicationId — panggil applications.list dulu kalau belum punya. Status valid: applied, screening, interview, offer, rejected, accepted.",
      kind: "mutation",
      cta: "Update status",
      args: {
        applicationId: { type: "string", label: "ID lamaran", required: true },
        status: { type: "string", label: "Status baru", required: true, example: "interview" },
        notes: { type: "string", label: "Catatan tambahan", required: false },
      },
    },
    {
      id: "applications.delete",
      label: "Hapus lamaran",
      description:
        "Hapus 1 lamaran berdasarkan applicationId. Panggil applications.list dulu kalau belum punya ID. Aksi destructive — selalu butuh persetujuan user.",
      kind: "mutation",
      cta: "Hapus lamaran",
      args: {
        applicationId: { type: "string", label: "ID lamaran yang dihapus", required: true },
      },
    },
  ],
};
