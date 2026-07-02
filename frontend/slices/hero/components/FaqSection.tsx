"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "Apakah CareerPack gratis?",
    answer:
      "Ya. Ada paket gratis untuk mulai membuat CV, ceklis dokumen, dan mencoba fitur dasar — tanpa kartu kredit. Fitur lanjutan bisa ditambah kapan saja saat Anda butuh lebih.",
  },
  {
    question: "Apakah CV yang dibuat benar-benar lolos ATS?",
    answer:
      "Template kami dirancang dengan struktur yang bisa dibaca sistem ATS — tanpa tabel rumit, kolom ganda, atau elemen grafis yang bikin parser bingung. Jadi kata kunci dan pengalaman Anda tetap terbaca utuh oleh sistem screening perusahaan.",
  },
  {
    question: "Bagaimana cara kerja asisten AI di CareerPack?",
    answer:
      "Asisten AI membantu meninjau CV Anda, memberi latihan simulasi wawancara dengan pertanyaan relevan, dan mencocokkan profil Anda dengan lowongan yang sesuai — semua dari satu percakapan.",
  },
  {
    question: "Apakah data saya aman?",
    answer:
      "Data Anda tersimpan terenkripsi dan hanya bisa diakses oleh akun Anda sendiri. Kami tidak menjual data ke pihak ketiga, dan Anda bisa menghapus data kapan saja dari pengaturan akun.",
  },
  {
    question: "Bisa dipakai untuk melamar kerja di luar negeri?",
    answer:
      "Bisa. CareerPack memang dibuat untuk pencari kerja lokal maupun luar negeri — mulai dari format CV internasional sampai roadmap skill yang relevan dengan pasar kerja global.",
  },
];

export function FaqSection() {
  return (
    <section className="relative border-t border-border bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <span className="inline-flex items-center gap-2 text-brand">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-brand text-[10px]">06</span>
              Pertanyaan Umum
            </span>
            <span className="h-px w-8 bg-border" />
            <span>FAQ</span>
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Masih Ada Pertanyaan?
          </h2>
        </div>

        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible>
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`}>
                <AccordionTrigger className="font-medium text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
