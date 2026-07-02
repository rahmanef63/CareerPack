import type {
  ApplicationExample,
  DocumentSkeletonLine,
  InterviewExample,
  ProcessStep,
  ProfileChecklistItem,
  StatusTrackStage,
} from "../types/process.types";

/** The 4 roadmap steps rendered on the right column, top to bottom. */
export const PROCESS_STEPS: ProcessStep[] = [
  {
    id: 1,
    title: "Isi Profil",
    description: "Lengkapi profil karir sekali, dipakai otomatis di semua fitur.",
  },
  {
    id: 2,
    title: "Bangun Dokumen",
    description: "CV ATS-friendly, roadmap skill, dan ceklis dokumen tersusun otomatis.",
  },
  {
    id: 3,
    title: "Latihan dengan AI",
    description: "Simulasi wawancara dan asisten AI membantu Anda lebih siap.",
  },
  {
    id: 4,
    title: "Lamar & Lacak",
    description: "Kirim lamaran, lacak progres, sampai tawaran diterima.",
  },
];

/** Checklist rows in the "Isi Profil" preview card (step 1). */
export const PROFILE_CHECKLIST: ProfileChecklistItem[] = [
  { label: "Informasi Dasar", done: true },
  { label: "Pengalaman Kerja", done: true },
  { label: "Pendidikan", done: true },
  { label: "Keahlian & Sertifikasi", done: false },
];

export const PROFILE_COMPLETION_PERCENT = 85;

/** Simulated document text lines in the "Bangun Dokumen" preview (step 2). */
export const DOCUMENT_SKELETON_LINES: DocumentSkeletonLine[] = [
  { widthClassName: "w-full" },
  { widthClassName: "w-5/6" },
  { widthClassName: "w-2/3" },
];

export const DOCUMENT_EXAMPLE_ATS_SCORE = "Contoh Skor ATS: 92/100";
export const DOCUMENT_SUPPORT_LINE =
  "Struktur yang rapi membantu dokumen Anda lebih mudah dibaca.";

/** Illustrative interview Q&A in the "Latihan dengan AI" preview (step 3). */
export const INTERVIEW_EXAMPLE: InterviewExample = {
  question: "Ceritakan tentang tantangan terbesar yang pernah kamu hadapi.",
  feedbackLabel: "Contoh masukan:",
  feedback:
    "Coba tambahkan hasil konkret dari tantangan tersebut agar jawabanmu lebih meyakinkan.",
};

/** Example tracked application row in the "Lamar & Lacak" preview (step 4). */
export const APPLICATION_EXAMPLE: ApplicationExample = {
  role: "Contoh: Product Designer",
  company: "Contoh Perusahaan",
  status: "Interview",
};

/** Horizontal progress-stage track under the example application row. */
export const STATUS_TRACK_STAGES: StatusTrackStage[] = [
  { filled: true },
  { filled: true },
  { filled: true },
  { filled: false },
  { filled: false },
];
