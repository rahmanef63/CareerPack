import type { FaqTopic } from "../types/faq.types";

/** "Topik Populer" rows in the left column — a curated subset (not every
 * FAQ item) that jumps to + opens its matching accordion entry on click. */
export const FAQ_TOPICS: FaqTopic[] = [
  { id: "harga-paket", label: "Paket Gratis", faqItemId: "gratis" },
  { id: "ats-lamaran", label: "ATS & Lamaran", faqItemId: "ats" },
  { id: "asisten-ai", label: "Asisten AI", faqItemId: "asisten-ai" },
  { id: "roadmap-skill", label: "Roadmap Skill", faqItemId: "roadmap" },
  { id: "portofolio", label: "Portofolio", faqItemId: "portofolio" },
  { id: "sinkronisasi", label: "Sinkronisasi Perangkat", faqItemId: "sinkronisasi" },
  { id: "privasi-keamanan", label: "Privasi & Keamanan", faqItemId: "privasi" },
];
