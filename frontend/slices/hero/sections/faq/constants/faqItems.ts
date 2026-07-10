import type { FaqItem } from "../types/faq.types";

/**
 * FAQ copy — every answer describes a real product capability (cross-check
 * against `shared/lib/dashboardRegistry.ts`), never a fabricated stat or
 * outcome. Do not rewrite the wording of the first 5 items without re-review.
 */
export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "gratis",
    question: "Apakah CareerPack gratis?",
    answer:
      "Ya. Ada paket gratis untuk mulai membuat CV, ceklis dokumen, dan mencoba fitur dasar — tanpa kartu kredit. Fitur lanjutan bisa ditambah kapan saja saat Anda butuh lebih.",
  },
  {
    id: "ats",
    question: "Apakah CV yang dibuat benar-benar lolos ATS?",
    answer:
      "Template kami dirancang dengan struktur yang bisa dibaca sistem ATS — tanpa tabel rumit, kolom ganda, atau elemen grafis yang bikin parser bingung. Jadi kata kunci dan pengalaman Anda tetap terbaca utuh oleh sistem screening perusahaan.",
  },
  {
    id: "asisten-ai",
    question: "Bagaimana cara kerja asisten AI di CareerPack?",
    answer:
      "Asisten AI membantu meninjau CV Anda, memberi latihan simulasi wawancara dengan pertanyaan relevan, dan mencocokkan profil Anda dengan lowongan yang sesuai — semua dari satu percakapan.",
  },
  {
    id: "privasi",
    question: "Apakah data saya aman?",
    answer:
      "Data Anda tersimpan terenkripsi dan hanya bisa diakses oleh akun Anda sendiri. Kami tidak menjual data ke pihak ketiga, dan Anda bisa menghapus data kapan saja dari pengaturan akun.",
  },
  {
    id: "internasional",
    question: "Bisa dipakai untuk melamar kerja di luar negeri?",
    answer:
      "Bisa. CareerPack memang dibuat untuk pencari kerja lokal maupun luar negeri — mulai dari format CV internasional sampai roadmap skill yang relevan dengan pasar kerja global.",
  },
  {
    id: "roadmap",
    question: "Apa itu Roadmap Skill?",
    answer:
      "Peta skill interaktif per jalur karier yang progresnya bisa Anda tandai sendiri — membantu Anda tahu skill apa yang perlu dipelajari selanjutnya.",
  },
  {
    id: "portofolio",
    question: "Bisa membuat halaman portofolio online?",
    answer:
      "Bisa. Fitur Portofolio dan Personal Branding membantu Anda membuat halaman profil publik yang menampilkan pengalaman dan karya Anda.",
  },
  {
    id: "jaringan",
    question: "Apakah CareerPack bisa membantu mengelola jaringan profesional?",
    answer:
      "Ya. Fitur Jaringan menyimpan kontak rekruter, mentor, dan rekan kerja lengkap dengan catatan, jadi tidak ada relasi penting yang terlewat.",
  },
  {
    id: "kalkulator",
    question: "Apa fungsi Kalkulator Keuangan di CareerPack?",
    answer:
      "Membantu menghitung kesiapan finansial saat pindah kerja atau relokasi, termasuk perbandingan biaya hidup antar kota.",
  },
  {
    id: "sinkronisasi",
    question: "Apakah data saya otomatis tersinkron di semua perangkat?",
    answer:
      "Ya. Data Anda tersimpan di server dan sinkron otomatis — login di perangkat mana saja dan progres Anda tetap sama. CareerPack juga bisa dipasang langsung dari browser sebagai aplikasi.",
  },
  {
    id: "notifikasi",
    question: "Apakah ada pengingat untuk jadwal wawancara atau deadline lamaran?",
    answer:
      "Ada. Notifikasi mengingatkan jadwal di kalender dan pembaruan penting lainnya, jadi Anda tidak melewatkan tenggat waktu.",
  },
  {
    id: "ats-scanner",
    question: "Bagaimana cara tahu CV saya lolos ATS untuk lowongan tertentu?",
    answer:
      "Di Pencocok Lowongan ada ATS Scanner: tempel CV dan deskripsi lowongan, lalu Anda dapat skor 0–100 beserta kata kunci yang hilang dan masalah format yang perlu diperbaiki. Ini alat diagnosis — bukan janji pasti lolos — tapi Anda tahu persis apa yang harus dibenahi sebelum mengirim.",
  },
  {
    id: "mock-interview",
    question: "Bagaimana simulasi wawancara AI menilai jawaban saya?",
    answer:
      "Pilih peran dan tingkat kesulitan, AI membuat pertanyaan, lalu tiap jawaban dievaluasi dengan rubrik STAR (Situation, Task, Action, Result) plus skor akhir dan umpan balik terperinci. Kalau kuota AI habis, simulasi tetap jalan memakai bank pertanyaan wawancara berbahasa Indonesia yang sudah dikurasi.",
  },
  {
    id: "pelacak-lamaran",
    question: "Bisa melacak banyak lamaran sekaligus?",
    answer:
      "Bisa. Pelacak Lamaran punya tampilan tabel maupun Kanban dengan pipeline applied → screening → interview → offer/ditolak/diterima, plus filter, pencarian, catatan, dan tanggal wawancara — jadi puluhan lamaran tetap rapi dalam satu papan.",
  },
  {
    id: "ai-persetujuan",
    question: "Apakah asisten AI bisa mengubah data saya tanpa izin?",
    answer:
      "Tidak. Aksi AI yang hanya membaca data berjalan langsung, tetapi setiap aksi yang menulis atau mengubah data (CV, lamaran, kontak, jadwal, ceklis) wajib Anda setujui dulu lewat kartu konfirmasi sebelum dieksekusi.",
  },
  {
    id: "kuota-ai",
    question: "Ada batasan pemakaian fitur AI?",
    answer:
      "Ada batas pemakaian wajar: maksimal 10 permintaan AI per menit dan 100 per hari per akun. Kalau tercapai, banyak fitur tetap bisa dipakai dalam mode non-AI. Ini guardrail pemakaian wajar, bukan paywall.",
  },
];
