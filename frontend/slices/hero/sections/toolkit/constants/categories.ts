import type { ToolkitCategoryContent } from "../types/toolkit.types";

/**
 * Authored Indonesian copy for the 4 toolkit categories. Feature order here
 * is the "registryId" that `useToolkitCategories` looks up in
 * `dashboardRegistry.ts` for the real label/icon/href/badge — this file only
 * carries the honest 1-line description of what each tool does, never
 * fabricated metrics.
 */
export const TOOLKIT_CATEGORIES: ToolkitCategoryContent[] = [
  {
    id: "persiapan",
    title: "Persiapan",
    tagline: "Siapkan dokumen dan jadwal Anda sebelum melangkah ke tahap melamar.",
    tip: "Persiapan yang terstruktur membantu Anda melangkah dengan lebih percaya diri.",
    features: [
      {
        registryId: "cv",
        description:
          "Susun CV dengan struktur yang mudah dibaca sistem ATS, lengkap dengan preview langsung.",
      },
      {
        registryId: "calendar",
        description:
          "Catat jadwal wawancara, deadline lamaran, dan pengingat lain dalam satu kalender.",
      },
      {
        registryId: "interview",
        description:
          "Latihan simulasi wawancara dengan pertanyaan dari AI dan umpan balik per jawaban.",
      },
    ],
  },
  {
    id: "melamar",
    title: "Melamar",
    tagline: "Kelola proses lamaran dari pencatatan lowongan sampai keputusan akhir.",
    tip: "Semua tahapan lamaran tercatat di satu tempat, jadi tidak ada yang terlewat.",
    features: [
      {
        registryId: "applications",
        description:
          "Lacak status setiap lamaran — dari terkirim, wawancara, hingga tawaran — lewat tabel atau papan Kanban.",
      },
      {
        registryId: "matcher",
        description:
          "Cocokkan CV Anda dengan lowongan dan dapatkan skor kecocokan dari AI.",
      },
      {
        registryId: "checklist",
        description:
          "Ceklis dokumen persiapan kerja untuk lamaran lokal maupun luar negeri.",
      },
      {
        registryId: "calculator",
        description:
          "Hitung kesiapan finansial untuk pindah kerja atau relokasi, termasuk perbandingan biaya hidup antar kota.",
      },
    ],
  },
  {
    id: "berkembang",
    title: "Berkembang",
    tagline: "Rencanakan pengembangan skill dan perkaya wawasan karier Anda.",
    tip: "Skill yang terus diasah membuka lebih banyak peluang karier.",
    features: [
      {
        registryId: "roadmap",
        description:
          "Peta skill interaktif per jalur karier, dengan progres yang bisa Anda tandai sendiri.",
      },
      {
        registryId: "library",
        description:
          "Simpan dan kelola dokumen serta gambar yang dipakai ulang di CV, portofolio, dan personal branding.",
      },
    ],
  },
  {
    id: "karier-jangka-panjang",
    title: "Karier Jangka Panjang",
    tagline: "Bangun relasi dan citra profesional untuk perjalanan karier yang berkelanjutan.",
    tip: "Relasi dan reputasi profesional yang terjaga membuka peluang di luar lamaran aktif.",
    features: [
      {
        registryId: "networking",
        description:
          "Kelola kontak profesional — rekruter, mentor, rekan kerja — lengkap dengan catatan dan akses cepat.",
      },
      {
        registryId: "personal-branding",
        description:
          "Bangun halaman profil publik yang menampilkan pengalaman dan portofolio Anda.",
      },
    ],
  },
];
