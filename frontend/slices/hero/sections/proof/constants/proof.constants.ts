import type {
  AtsMechanismPoint,
  FeatureGridItem,
  FreeTierItem,
  HighlightFeature,
  ProofCardContent,
  SupportChatBubble,
} from "../types/proof.types";

/**
 * Literal Indonesian copy for the Proof section. CareerPack is early-stage
 * with no real usage analytics and no verified named testimonials — every
 * string here is either a plain product-capability statement or explicitly
 * labeled as illustrative/example. Never add a named person + city quote,
 * a satisfaction rating, a usage count, or an outcome percentage presented
 * as real data. See HONESTY RULE in the section brief.
 */

export const PROOF_EYEBROW = "Bukti yang Bicara";

export const PROOF_HEADING = "4 Alasan Kenapa CareerPack Jadi Pilihan Cerdas";

export const PROOF_LEAD =
  "Bukan angka yang belum kami buktikan — ini kemampuan produk yang sudah bisa Anda pakai hari ini, dari satu paket lengkap sampai dukungan yang selalu siap.";

/** Headline for the blue highlight card — honest, forward-looking, no
 * fabricated named testimonial or invented stats (unlike the design
 * reference this section replaces). */
export const HIGHLIGHT_HEADLINE =
  "Dirancang untuk membantu CV Anda dilirik lebih cepat.";

export const HIGHLIGHT_SUBTEXT =
  "Bukan klaim hasil — ini fitur yang benar-benar ada di dalam aplikasi.";

/** 3 honest feature callouts replacing the fabricated "+3x Interview /
 * +85% Response Rate / -70% Waktu Buat CV" stats in the design reference. */
export const HIGHLIGHT_FEATURES: HighlightFeature[] = [
  { id: "ats-ready", label: "CV ATS-Ready" },
  { id: "interview-ai", label: "Latihan Wawancara AI" },
  { id: "track-all", label: "Lacak Semua Lamaran" },
];

export const PROOF_CARDS: ProofCardContent[] = [
  {
    id: "bundle",
    title: "4-in-1 Paket Lengkap untuk Karir Impian",
    description: "Semua alat yang Anda butuhkan untuk melamar kerja, dalam satu dashboard.",
  },
  {
    id: "ats",
    title: "ATS-Ready, Struktur yang Mudah Dibaca Sistem",
    description: "Template disusun mengikuti kaidah yang ramah parser pelacak lamaran.",
  },
  {
    id: "support",
    title: "Dukungan Kapan Anda Butuhkan",
    description: "Asisten AI siap menjawab pertanyaan seputar CV, lamaran, dan wawancara.",
  },
  {
    id: "free",
    title: "Mulai Gratis, Tanpa Kartu Kredit",
    description: "Coba dulu, upgrade kalau memang butuh lebih.",
  },
];

/** 2x2 icon grid on the "bundle" card. */
export const FEATURE_GRID_ITEMS: FeatureGridItem[] = [
  { id: "cv", label: "CV ATS" },
  { id: "calendar", label: "Kalender" },
  { id: "interview", label: "Interview" },
  { id: "documents", label: "Dokumen" },
];

/** Illustrative donut score on the "ats" card — explicitly labeled as an
 * example, not a guaranteed or measured outcome. */
export const ATS_SCORE_VALUE = 92;
export const ATS_SCORE_CAPTION = "*Contoh skor, bukan jaminan hasil";

/** What actually makes the template easier for an ATS parser to read —
 * mechanism, never a promised result. */
export const ATS_MECHANISM_POINTS: AtsMechanismPoint[] = [
  { id: "structure", text: "Struktur bagian yang jelas — pengalaman, pendidikan, dan skill terpisah rapi" },
  { id: "keywords", text: "Kata kunci relevan diselaraskan dengan deskripsi pekerjaan" },
  { id: "formatting", text: "Format standar tanpa tabel atau elemen grafis yang membingungkan parser" },
  { id: "parseable", text: "Teks disusun agar mudah diekstrak sistem pelacak lamaran" },
];

/** Illustrative 3-bubble support exchange — a UI mock of the feature, not
 * a transcript of a real conversation. */
export const SUPPORT_CHAT_BUBBLES: SupportChatBubble[] = [
  { id: "q1", from: "user", text: "Kenapa CV saya belum dilirik recruiter?" },
  { id: "a1", from: "assistant", text: "Coba tambahkan kata kunci dari deskripsi pekerjaan di bagian pengalaman Anda." },
  { id: "q2", from: "user", text: "Oke, saya coba perbaiki sekarang." },
];

/** What the free tier actually includes today — matches the product's
 * existing "Gratis" framing elsewhere in the app. */
export const FREE_TIER_ITEMS: FreeTierItem[] = [
  { id: "unlimited-drafts", label: "Buat CV ATS-ready tanpa batas draf" },
  { id: "tracker", label: "Simpan dan lacak lamaran pekerjaan" },
  { id: "ai-basic", label: "Akses asisten AI dasar" },
  { id: "no-card", label: "Tanpa kartu kredit, tanpa auto-charge" },
];
