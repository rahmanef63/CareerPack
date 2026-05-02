import { FileText } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * CV-generator slice manifest — owns `cvs` table CRUD via the AI
 * agent. Granular skills mirror the patterns in calendar/applications:
 * list-first to learn IDs, then targeted compose/mutation.
 *
 * `cv.import-from-text` is the agent-facing wrapper around the
 * "Isi Cepat dengan AI" flow: paste raw resume / LinkedIn text → AI
 * parser action returns a structured QuickFill payload → quickFill
 * mutation hydrates profile + cv + portfolio + goals + applications +
 * contacts in one batch (undoable). The capability binder runs the
 * full chain after user approves.
 */
export const cvGeneratorManifest: SliceManifest = {
  id: "cv-generator",
  label: "CV Generator",
  description: "Buat dan kelola CV dengan template profesional",
  icon: FileText,

  route: {
    slug: "cv",
    component: () =>
      import("./components/CVGenerator").then((m) => ({ default: m.CVGenerator })),
  },

  nav: {
    placement: "primary",
    order: 20,
    href: "/dashboard/cv",
  },

  skills: [
    {
      id: "cv.list",
      label: "Lihat daftar CV",
      description:
        "Ambil daftar semua CV user (judul, template, jumlah pengalaman/skill, summary). Pakai DULU sebelum update/delete kalau user punya >1 CV. Semua mutation tanpa cvId akan otomatis pakai CV default.",
      kind: "query",
    },
    {
      id: "cv.create",
      label: "Buat CV baru",
      description:
        "Buat CV kosong baru dengan judul + template (modern|classic|minimal). PersonalInfo otomatis diisi dari profile user. Selanjutnya pakai cv.add-experience / cv.add-skills / cv.update-summary untuk mengisi.",
      kind: "compose",
      cta: "Buat CV",
      args: {
        title: {
          type: "string",
          label: "Judul CV (mis. 'CV Frontend Engineer 2026')",
          required: true,
          example: "CV Frontend Engineer",
        },
        template: {
          type: "string",
          label: "Template (modern|classic|minimal)",
          required: true,
          example: "modern",
        },
      },
    },
    {
      id: "cv.add-experience",
      label: "Tambah pengalaman kerja",
      description:
        "Append 1 entri pengalaman ke CV. cvId opsional — tanpa cvId akan pakai CV default user. Tanggal pakai format YYYY-MM (mis. '2024-01'). Kalau masih bekerja di sana set current=true dan kosongkan endDate.",
      kind: "mutation",
      cta: "Tambah pengalaman",
      args: {
        cvId: { type: "string", label: "ID CV (opsional)", required: false },
        company: { type: "string", label: "Nama perusahaan", required: true, example: "Tokopedia" },
        position: { type: "string", label: "Posisi/jabatan", required: true, example: "Frontend Engineer" },
        startDate: { type: "string", label: "Tanggal mulai (YYYY-MM)", required: true, example: "2024-01" },
        endDate: { type: "string", label: "Tanggal selesai (YYYY-MM)", required: false, example: "2026-03" },
        current: { type: "boolean", label: "Masih bekerja di sini?", required: false },
        description: { type: "string", label: "Deskripsi singkat peran", required: false },
      },
    },
    {
      id: "cv.add-skills",
      label: "Tambah skill ke CV",
      description:
        "Append skill baru ke CV (duplikat di-skip case-insensitive). cvId opsional — tanpa cvId pakai CV default. Skills berupa array string singkat (mis. ['React', 'TypeScript', 'Node.js']).",
      kind: "mutation",
      cta: "Tambah skill",
      args: {
        cvId: { type: "string", label: "ID CV (opsional)", required: false },
        skills: { type: "string[]", label: "Daftar skill", required: true, example: "['React', 'TypeScript']" },
        category: { type: "string", label: "Kategori (technical|soft|tools|general)", required: false, example: "technical" },
      },
    },
    {
      id: "cv.update-summary",
      label: "Update ringkasan profesional",
      description:
        "Ganti field summary di CV (1-3 kalimat ringkas). cvId opsional — tanpa cvId pakai CV default. Pakai untuk permintaan 'perbaiki ringkasan CV', 'tulis ulang summary CV', dll.",
      kind: "mutation",
      cta: "Simpan ringkasan",
      args: {
        cvId: { type: "string", label: "ID CV (opsional)", required: false },
        summary: { type: "string", label: "Ringkasan baru (1-3 kalimat)", required: true },
      },
    },
    {
      id: "cv.delete",
      label: "Hapus CV",
      description:
        "Hapus 1 CV berdasarkan cvId. Cascade: ATS scans yang terkait ikut terhapus, tapi lamaran kerja yang ter-link cvId-nya tetap (cvId di-unset). Aksi destructive — perlu persetujuan user.",
      kind: "mutation",
      cta: "Hapus CV",
      args: {
        cvId: { type: "string", label: "ID CV", required: true },
      },
    },
    {
      id: "cv.import-from-text",
      label: "Isi Cepat dari teks (resume/LinkedIn)",
      description:
        "Parser AI yang ubah blok teks resume / profil LinkedIn jadi data terstruktur lalu hydrate profile + CV + portfolio + goals + lamaran + kontak sekaligus. Pakai saat user paste resume mentah dan minta 'isi otomatis' / 'import resume' / 'parse CV ini'. Min 40 karakter.",
      kind: "compose",
      cta: "Isi Cepat dengan AI",
      args: {
        text: {
          type: "string",
          label: "Teks resume / profil LinkedIn user",
          required: true,
          example: "Budi Santoso\nFrontend Engineer · Jakarta\n5 tahun pengalaman React, Next.js...",
        },
      },
    },
  ],
};
