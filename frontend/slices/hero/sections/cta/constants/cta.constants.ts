import type { CtaBenefit } from "../types/cta.types";

/**
 * Literal Indonesian copy for the Cta section. CareerPack is early-stage
 * with no real usage analytics and no verified named testimonials — every
 * string here is a plain product-capability statement, never a fabricated
 * metric or invented quote. See HONESTY RULE in the section brief.
 */

export const CTA_EYEBROW = "Mulai Sekarang";

export const CTA_HEADING = "Perjalanan karier besar dimulai dari langkah pertama.";

export const CTA_LEAD =
  "Buat CV, rapikan dokumen, latihan interview, dan lacak lamaran Anda dalam satu tempat—tanpa kartu kredit.";

export const CTA_BUTTON_LABEL = "Mulai Gratis";

/** 3 honest benefit rows for the right-column card — real product
 * capabilities, not fabricated outcomes or usage stats. */
export const CTA_BENEFITS: CtaBenefit[] = [
  {
    id: "core-access",
    title: "Akses fitur inti",
    description: "Semua kebutuhan dasar pencari kerja tersedia sejak awal.",
  },
  {
    id: "ready-templates",
    title: "Template siap pakai",
    description: "CV, checklist, dan panduan yang bisa langsung digunakan.",
  },
  {
    id: "visible-progress",
    title: "Progress terlihat",
    description: "Pantau apa yang sudah siap dan apa yang perlu ditingkatkan.",
  },
];
