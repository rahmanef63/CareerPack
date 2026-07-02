import type { Scenario } from "../types/scenario";

/**
 * Illustrative usage scenarios — NOT real user testimonials. CareerPack is
 * early-stage with no verified named users, so these are deliberately
 * unnamed personas ("Skenario: ...") describing plausible ways the product
 * is meant to be used. The disclaimer rendered alongside this data in
 * `ScenariosSection` is load-bearing — do not remove it if you edit copy
 * here, and do not attribute any of this to a specific named person.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: "fresh-graduate",
    category: "Fresh Graduate",
    headline: "Baru lulus, belum punya pengalaman kerja formal",
    situasi:
      "Baru lulus kuliah dan belum punya banyak pengalaman kerja untuk ditonjolkan. Masih meraba-raba format CV dan lamaran yang sesuai standar industri.",
    tantangan:
      "Bingung menyusun CV yang terstruktur rapi, dan belum terbiasa menjawab pertanyaan wawancara kerja yang pertama kali dihadapi.",
    steps: [
      { label: "Bangun Profil" },
      { label: "Belajar Dasar" },
      { label: "Latihan Interview" },
      { label: "Lamar" },
    ],
    hasil:
      "Diharapkan lebih siap melamar dengan CV yang terstruktur rapi dan bekal dasar menghadapi wawancara pertama.",
    quote:
      "Pakai template CV builder untuk menyusun CV yang terstruktur rapi agar lebih mudah terbaca sistem screening ATS.",
  },
  {
    id: "career-switcher",
    category: "Career Switcher",
    headline: "Ingin pindah jalur karir ke bidang yang berbeda",
    situasi:
      "Sudah bekerja beberapa tahun di satu bidang, tapi ingin pindah ke jalur karir yang cukup berbeda dari pengalaman sebelumnya.",
    tantangan:
      "Perlu memetakan skill yang bisa dibawa, mempelajari skill baru yang relevan, lalu mengemas ulang profil agar sesuai bidang baru.",
    steps: [
      { label: "Pemetaan Skill" },
      { label: "Belajar Skill Baru" },
      { label: "Reposisi Profil" },
      { label: "Cari Peluang" },
    ],
    hasil:
      "Diharapkan profil lebih relevan dengan bidang baru dan lebih percaya diri melamar ke peluang lintas karir.",
    quote:
      "Latihan wawancara dengan asisten AI untuk membangun kepercayaan diri sebelum pindah jalur karir ke bidang baru.",
  },
  {
    id: "active-seeker",
    category: "Pencari Kerja Aktif",
    headline: "Sedang aktif melamar ke banyak posisi sekaligus",
    situasi:
      "Sudah punya pengalaman kerja dan sedang aktif melamar ke banyak posisi sekaligus di berbagai perusahaan.",
    tantangan:
      "Sulit melacak status banyak lamaran sekaligus, dan memastikan CV serta jawaban wawancara tetap tajam di setiap kesempatan.",
    steps: [
      { label: "Optimalkan CV" },
      { label: "Simulasi Wawancara" },
      { label: "Cari Lowongan" },
      { label: "Follow-up" },
    ],
    hasil:
      "Diharapkan lamaran lebih terorganisir dengan CV yang tajam dan persiapan wawancara yang matang di setiap kesempatan.",
    quote:
      "Pakai tracker lamaran untuk memantau banyak lamaran sekaligus dan tahu mana yang perlu di-follow up.",
  },
];
