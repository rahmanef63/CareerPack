import type { SeedCountryDocs } from "./types";

export const QA_DOCS: SeedCountryDocs = {
  country: "QA",
  countryLabel: "Qatar",
  flag: "🇶🇦",
  description: "Dokumen untuk visa kerja & Qatar ID (QID) di bawah sponsor pemberi kerja.",
  documents: [
    {
      id: "qa-work-visa",
      title: "Visa Kerja / Entry Permit",
      description: "Diajukan oleh pemberi kerja (sponsor) sebelum keberangkatan.",
      category: "visa",
      required: true,
      issuingAuthority: "Ministry of Labour Qatar",
    },
    {
      id: "qa-passport",
      title: "Paspor",
      description: "Paspor RI yang masih berlaku.",
      category: "travel",
      required: true,
      issuingAuthority: "Imigrasi RI",
    },
    {
      id: "qa-contract",
      title: "Kontrak Kerja",
      description: "Cek klausa gaji, jam kerja, cuti tahunan, dan tiket pulang sebelum tanda tangan.",
      category: "employment",
      required: true,
    },
    {
      id: "qa-certificates",
      title: "Ijazah / Sertifikat Profesi (Dilegalisir)",
      description: "Perlu dilegalisir/attested sesuai posisi yang dilamar.",
      category: "education",
      required: false,
    },
    {
      id: "qa-wafid",
      title: "Tes Medis Wafid (Pra-Keberangkatan)",
      description: "Pemeriksaan kesehatan di Indonesia sebelum berangkat, sesuai standar GCC.",
      category: "health",
      required: true,
    },
    {
      id: "qa-medical-arrival",
      title: "Pemeriksaan Medis Kedatangan",
      description: "Dilakukan di fasilitas kesehatan resmi (mis. Hamad Medical) setelah tiba di Qatar.",
      category: "health",
      required: true,
    },
    {
      id: "qa-qid",
      title: "Qatar ID (QID)",
      description: "Kartu identitas residensi — diurus setelah tiba, wajib dibawa setiap saat.",
      category: "identity",
      required: true,
      issuingAuthority: "Ministry of Interior Qatar",
    },
    {
      id: "qa-health-insurance",
      title: "Asuransi Kesehatan",
      description: "Pendaftaran asuransi kesehatan sesuai ketentuan sponsor/pemberi kerja.",
      category: "insurance",
      required: true,
    },
  ],
};
