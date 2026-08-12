/**
 * Landing-page FAQ — the SINGLE source for both the visible accordion
 * (`FaqSection`) and the `FAQPage` JSON-LD emitted by the landing route.
 *
 * Both must stay identical: Google's structured-data policy requires the
 * answer text in the markup to be visible on the page, and a schema-only
 * FAQ is a manual-action risk. Deriving both from this one array is what
 * makes drift impossible — do NOT hand-write question/answer pairs into
 * the JSON-LD in `app/(marketing)/page.tsx`.
 *
 * Answers are plain strings, not JSX, for exactly that reason: JSON-LD
 * needs `text`, so anything that cannot be serialised as a sentence does
 * not belong in an answer.
 *
 * Every claim below is checked against the code, not the pitch deck:
 *   - 9 country checklists     → convex/_seeds/documents/{ae,au,de,id,jp,kr,nl,sa,sg}.ts
 *   - 3 CV templates           → slices/cv-generator/components/templates/
 *   - national / international → docs/features/cv-generator.md
 *   - 12 translate targets     → shared/lib/googleTranslate.ts TRANSLATE_TARGETS
 *   - PBKDF2-SHA256 100k       → convex/auth.ts (and app/privacy)
 *   - self-serve account wipe  → slices/settings/components/DangerZoneCard.tsx
 *   - demo session             → slices/hero/.../useHeroActions.ts (loginAsDemo)
 *   - bring-your-own AI key    → docs/features/ai-settings.md
 * No user counts, no ratings, no testimonials — we have none of those.
 */
export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    q: "Apakah CareerPack gratis?",
    a: "Ya. Editor CV, ekspor PDF, pelacak lamaran, ceklis dokumen, roadmap skill, latihan wawancara, dan asisten AI bisa dipakai tanpa biaya dan tanpa kartu kredit. Tidak ada masa percobaan yang berakhir dan tidak ada fitur yang tiba-tiba terkunci setelah Anda mengisinya.",
  },
  {
    q: "Apakah CV yang dibuat ramah ATS?",
    a: "Ya. CV disimpan sebagai data terstruktur — bukan kotak teks di atas gambar — lalu dirender ke PDF yang teksnya tetap terbaca mesin. Tersedia format internasional tanpa foto untuk sistem ATS, dan format nasional dengan pasfoto untuk lowongan di Indonesia. Pemindai ATS bawaan membandingkan CV Anda dengan deskripsi lowongan lalu menunjukkan kata kunci yang belum ada.",
  },
  {
    q: "Bisakah CareerPack dipakai melamar kerja ke luar negeri?",
    a: "Bisa. Tersedia ceklis dokumen kerja untuk sembilan negara: Singapura, Jepang, Korea Selatan, Uni Emirat Arab, Arab Saudi, Belanda, Jerman, Australia, dan Indonesia. Setiap dokumen disertai keterangan wajib atau opsional, lembaga penerbitnya, dan catatan masa berlaku. Panduannya bisa dibaca lebih dulu di halaman Panduan Dokumen tanpa membuat akun.",
  },
  {
    q: "Bahasa apa saja yang didukung?",
    a: "Antarmuka aplikasi berbahasa Indonesia. Satu ketukan menerjemahkan seluruh aplikasi ke dua belas bahasa lain, termasuk Inggris, Arab, Jerman, Belanda, Jepang, Korea, dan Mandarin. Isi CV bisa diterjemahkan terpisah oleh AI, jadi Anda dapat menyimpan versi Indonesia dan versi Inggris dari CV yang sama.",
  },
  {
    q: "Apakah data saya aman?",
    a: "Data Anda privat secara bawaan — hanya akun Anda yang bisa membaca dan menulisnya, dan kami tidak menjualnya. Halaman profil publik hanya aktif kalau Anda sendiri yang menyalakannya, termasuk pilihan boleh atau tidaknya mesin pencari mengindeks halaman itu. Kata sandi disimpan sebagai hash PBKDF2-SHA256 seratus ribu iterasi, dan Anda bisa menghapus akun beserta seluruh datanya kapan saja dari halaman Pengaturan.",
  },
  {
    q: "Bisakah mencoba tanpa mendaftar?",
    a: "Bisa. Tombol Lihat Demo membuka sesi demo berisi data contoh, jadi Anda bisa menjelajahi dashboard, editor CV, dan pelacak lamaran tanpa email maupun kata sandi. Kalau cocok, lanjutkan dengan membuat akun; kalau tidak, hapus sesi demo itu dari halaman Pengaturan.",
  },
  {
    q: "Apakah saya perlu API key AI sendiri?",
    a: "Tidak. Asisten AI, saran per bagian CV, dan pemindai ATS sudah tersedia dengan kuota harian per akun. Kalau Anda ingin memakai penyedia atau model sendiri — misalnya OpenAI, OpenRouter, atau Groq — masukkan kunci Anda di Pengaturan AI dan permintaan Anda akan memakai kunci itu.",
  },
  {
    q: "Perlu memasang aplikasi?",
    a: "Tidak wajib. CareerPack berjalan di browser mana pun. Di ponsel, aplikasinya dapat dipasang sebagai PWA sehingga muncul seperti aplikasi biasa di layar utama, dan tetap menampilkan halaman offline ketika sinyal hilang.",
  },
  {
    q: "Apa bedanya dengan template CV di aplikasi pengolah kata?",
    a: "Template mengurus tampilan satu berkas; CareerPack mengurus prosesnya. Data CV Anda diisi sekali lalu dipakai ulang untuk beberapa versi, dinilai otomatis, dicocokkan dengan deskripsi lowongan, dan tersambung ke lamaran yang sedang Anda lacak, dokumen yang harus disiapkan, serta skill yang masih perlu dikejar.",
  },
];
