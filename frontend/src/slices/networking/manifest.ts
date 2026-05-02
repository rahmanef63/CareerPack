import { Users } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Networking slice manifest — kontak profesional (recruiter, mentor,
 * peer). AI skills mirror the calendar/applications pattern: list,
 * create, update, delete. Role enum is enforced server-side too.
 */
export const networkingManifest: SliceManifest = {
  id: "networking",
  label: "Jaringan",
  description: "Kontak profesional, recruiter, mentor",
  icon: Users,

  route: {
    slug: "networking",
    component: () =>
      import("./components/NetworkingView").then((m) => ({
        default: m.NetworkingView,
      })),
  },

  nav: {
    placement: "more",
    order: 50,
    href: "/dashboard/networking",
    hue: "from-rose-400 to-rose-600",
  },

  skills: [
    {
      id: "contacts.list",
      label: "Lihat kontak",
      description:
        "Ambil daftar semua kontak (nama, role, perusahaan, email, dll). Pakai DULU sebelum update/delete supaya dapat contactId.",
      kind: "query",
    },
    {
      id: "contacts.create",
      label: "Tambah kontak baru",
      description:
        "Catat kontak baru ke jaringan. Role wajib salah satu dari: recruiter, mentor, peer, other.",
      kind: "compose",
      cta: "Simpan kontak",
      args: {
        name: { type: "string", label: "Nama lengkap", required: true, example: "Budi Santoso" },
        role: { type: "string", label: "Role (recruiter|mentor|peer|other)", required: true, example: "recruiter" },
        company: { type: "string", label: "Perusahaan", required: false, example: "Tokopedia" },
        position: { type: "string", label: "Jabatan", required: false, example: "HR Manager" },
        email: { type: "string", label: "Email", required: false, example: "budi@tokopedia.com" },
        phone: { type: "string", label: "Nomor telepon", required: false },
        linkedinUrl: { type: "string", label: "URL LinkedIn", required: false },
        notes: { type: "string", label: "Catatan", required: false },
      },
    },
    {
      id: "contacts.update",
      label: "Edit kontak",
      description:
        "Ubah field kontak yang sudah ada. WAJIB contactId — panggil contacts.list kalau belum punya. Hanya kirim field yang mau diubah.",
      kind: "mutation",
      cta: "Simpan perubahan",
      args: {
        contactId: { type: "string", label: "ID kontak", required: true },
        name: { type: "string", label: "Nama baru", required: false },
        role: { type: "string", label: "Role baru", required: false },
        company: { type: "string", label: "Perusahaan baru", required: false },
        position: { type: "string", label: "Jabatan baru", required: false },
        email: { type: "string", label: "Email baru", required: false },
        phone: { type: "string", label: "Phone baru", required: false },
        linkedinUrl: { type: "string", label: "LinkedIn baru", required: false },
        notes: { type: "string", label: "Catatan baru", required: false },
      },
    },
    {
      id: "contacts.delete",
      label: "Hapus kontak",
      description:
        "Hapus 1 kontak berdasarkan contactId. Aksi destructive — butuh persetujuan user.",
      kind: "mutation",
      cta: "Hapus kontak",
      args: {
        contactId: { type: "string", label: "ID kontak yang dihapus", required: true },
      },
    },
  ],
};
