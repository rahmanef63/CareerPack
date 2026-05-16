import { Compass } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Matcher slice manifest — owns `jobListings` (user-paste) +
 * `atsScans` table CRUD via the AI agent.
 *
 * The agent can browse the global feed, ingest a pasted JD, run an
 * ATS scan against a CV, and review past scan results. `add-job` is
 * a "compose" wrapper that chains the AI parser action with the
 * persistence mutation, mirroring the manual AddJobDialog flow.
 */
export const matcherManifest: SliceManifest = {
  id: "matcher",
  label: "Pencocok Lowongan",
  description: "Cocokkan CV ke lowongan + scan ATS",
  icon: Compass,

  route: {
    slug: "matcher",
    component: () =>
      import("./components/MatcherView").then((m) => ({ default: m.MatcherView })),
  },

  nav: {
    placement: "more",
    order: 40,
    href: "/dashboard/matcher",
    hue: "from-cyan-400 to-cyan-600",
    badge: "AI",
  },

  skills: [
    {
      id: "matcher.list-jobs",
      label: "Lihat lowongan publik",
      description:
        "Ambil lowongan terbaru dari feed publik (RemoteOK + WeWorkRemotely + paste user lain). Returns array of {jobId, title, company, location, workMode, seniority, employmentType, source, requiredSkills}. Pakai untuk 'apa lowongan terbaru', sebelum scan-ats butuh jobListingId.",
      kind: "query",
    },
    {
      id: "matcher.list-mine",
      label: "Lihat lowongan saya",
      description:
        "Ambil lowongan yang user paste sendiri (source='user-paste' & addedBy=current user). Pakai untuk 'lowongan yang aku catat', 'lihat job paste-an saya'.",
      kind: "query",
    },
    {
      id: "matcher.add-job",
      label: "Tambah lowongan dari teks",
      description:
        "Parser AI ubah blok teks deskripsi lowongan (LinkedIn / JobStreet / dll) jadi struktur lalu insert ke lowongan user. Min 80 karakter. Pakai saat user paste JD mentah dan minta 'simpan lowongan ini' / 'tambah ke matcher'. Perlu approval karena memanggil AI quota + write.",
      kind: "compose",
      cta: "Tambah lowongan",
      args: {
        text: {
          type: "string",
          label: "Teks deskripsi lowongan (min 80 karakter)",
          required: true,
          example:
            "Frontend Engineer at Tokopedia · Jakarta · 3-5y React/TypeScript...",
        },
      },
    },
    {
      id: "matcher.scan-ats",
      label: "Scan ATS (CV vs lowongan)",
      description:
        "Hitung skor ATS antara CV user dan 1 lowongan. WAJIB punya cvId (panggil cv.list dulu) + jobListingId (panggil matcher.list-jobs / matcher.list-mine dulu). Returns score + grade. Konsumsi quota AI.",
      kind: "compose",
      cta: "Scan ATS",
      args: {
        cvId: { type: "string", label: "ID CV (dari cv.list)", required: true },
        jobListingId: {
          type: "string",
          label: "ID lowongan (dari matcher.list-jobs / list-mine)",
          required: true,
        },
      },
    },
    {
      id: "matcher.list-scans",
      label: "Lihat riwayat scan ATS",
      description:
        "Ambil 20 scan ATS terbaru user (cvId, jobListingId, jobTitle, jobCompany, score, grade, createdAt). Pakai untuk 'cek scan terakhir', 'apa skor ATS saya'.",
      kind: "query",
    },
  ],
};
