import type {
  ApplicationRowContent,
  ChecklistRowItem,
  MiniStepContent,
  ResumeSectionContent,
  TrustPoint,
} from "../types/hero.types";

export const EYEBROW_TEXT = "Satu platform, semua siap.";

export const HEADLINE_PREFIX = "Semua yang Anda Butuhkan untuk ";
export const HEADLINE_HIGHLIGHT = "Karir Impian.";

export const LEAD_PARAGRAPH =
  "Siapkan dokumen yang kuat, latih wawancara dengan percaya diri, dan kelola setiap lamaran dalam satu tempat.";

export const CTA_PRIMARY_LABEL = "Mulai Gratis";
export const CTA_DEMO_LABEL = "Lihat Demo";
export const CTA_DEMO_LOADING_LABEL = "Memulai sesi demo…";

/** Left-column trust checklist row content. */
export const TRUST_POINTS: TrustPoint[] = [
  { id: "free", label: "Gratis mulai selamanya" },
  { id: "no-card", label: "Tanpa kartu kredit" },
  { id: "secure", label: "Aman & rahasia" },
];

export const MINI_STEPS_LABEL = "Langkah menuju tawaran";

/** "Langkah menuju tawaran" mini step-card copy. Visuals merged in from config via useHeroContent. */
export const MINI_STEPS: MiniStepContent[] = [
  {
    id: "profile",
    title: "Siapkan Profil",
    description: "CV, portofolio, dan surat lamaran yang menonjol.",
  },
  {
    id: "interview",
    title: "Latihan Wawancara",
    description: "Latih jawabanmu dan dapatkan umpan balik relevan.",
  },
  {
    id: "applications",
    title: "Kelola Lamaran",
    description: "Lacak setiap aplikasi dan jangan lewatkan peluang.",
  },
  {
    id: "offer",
    title: "Dapatkan Tawaran",
    description: "Percaya diri melangkah ke kesempatan terbaik.",
  },
];

/** Desk collage — resume mock card header copy. */
export const RESUME_CARD_NAME = "Dhimas Wicaksono";
export const RESUME_CARD_ROLE = "Product Designer · Jakarta, Indonesia";

/** Desk collage — resume mock card mini-section labels. Line widths merged in via config. */
export const RESUME_SECTIONS: ResumeSectionContent[] = [
  { id: "about", label: "TENTANG SAYA" },
  { id: "experience", label: "PENGALAMAN" },
  { id: "skills", label: "KEAHLIAN" },
];

/** Desk collage — dashed stamp badge copy. */
export const STAMP_TEXT = "Siap dipanggil interview";

/** Desk collage — first rotated sticky note copy. */
export const STICKY_NOTE_1_TEXT = "Persiapan hari ini, peluang esok hari.";

/** Desk collage — notebook checklist card title + rows (illustrative interview-prep example). */
export const CHECKLIST_CARD_TITLE = "Latihan Wawancara";
export const CHECKLIST_ITEMS: ChecklistRowItem[] = [
  { id: "intro", label: "Perkenalkan diri Anda", done: true },
  { id: "why", label: "Mengapa tertarik dengan posisi ini?", done: true },
  { id: "project", label: "Ceritakan proyek yang paling Anda banggakan", done: true },
  { id: "questions", label: "Pertanyaan untuk interviewer", done: false },
];

/** Desk collage — polaroid-style card caption (placeholder gradient, not a real photo). */
export const POLAROID_CAPTION = "Proses hari ini, hasil yang bermakna.";

/** Desk collage — application tracker card title + rows (illustrative example roles, not real users). */
export const TRACKER_CARD_TITLE = "Lamaran Saya";
export const APPLICATION_ROWS: ApplicationRowContent[] = [
  { id: "row-1", role: "Product Designer", company: "Contoh Perusahaan A", status: "Interview" },
  { id: "row-2", role: "UX Researcher", company: "Contoh Perusahaan B", status: "Ditinjau" },
  { id: "row-3", role: "Frontend Engineer", company: "Contoh Perusahaan C", status: "Tersimpan" },
];

/** Desk collage — second rotated note copy. */
export const STICKY_NOTE_2_TEXT =
  "Fokus pada nilai yang bisa kamu berikan, bukan hanya peran yang kamu cari.";
