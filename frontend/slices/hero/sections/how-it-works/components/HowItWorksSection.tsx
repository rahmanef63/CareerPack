import { FileText, ListChecks, Route, Table2 } from "lucide-react";
import type { ComponentType } from "react";

/**
 * Server Component — plain prose, no client runtime.
 *
 * Deliberately NOT using `useScrollReveal` / `.animate-on-scroll opacity-0`
 * like the sections above it. That pattern keeps text at `opacity: 0` until an
 * IntersectionObserver fires inside a hydrated client bundle, which is fine for
 * decoration and wrong for the only substantial copy on the page. Everything
 * here must be readable in the served HTML.
 */
interface Step {
  Icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    Icon: FileText,
    title: "Susun CV yang terbaca mesin",
    body: "Isi data diri, pengalaman, pendidikan, keterampilan, dan proyek satu per satu di editor terstruktur. Preview langsung menunjukkan hasilnya dalam tiga template — modern, klasik, minimal — skor kelengkapan menandai bagian yang masih kosong, dan hasil akhirnya diekspor ke PDF. Pilih format internasional tanpa foto agar lolos pembacaan ATS, atau format nasional dengan pasfoto untuk lowongan di Indonesia.",
  },
  {
    Icon: Table2,
    title: "Lacak setiap lamaran",
    body: "Setiap lowongan yang Anda kirimi masuk ke satu papan dengan status yang jelas: terkirim, screening, wawancara, penawaran, diterima, atau ditolak. Lihat sebagai tabel atau papan Kanban, simpan catatan dan tanggal wawancara, lalu tambahkan agendanya ke kalender karier supaya pengingat datang sebelum harinya — bukan sesudah.",
  },
  {
    Icon: ListChecks,
    title: "Lengkapi dokumen sebelum diminta",
    body: "Ceklis dokumen memisahkan berkas untuk kerja di Indonesia dan berkas untuk kerja di luar negeri. Tiap item punya penanda wajib atau opsional, catatan pribadi, dan tanggal kedaluwarsa — supaya paspor yang tinggal empat bulan ketahuan sekarang, bukan seminggu sebelum berangkat. Lembaga penerbitnya bisa dilihat di panduan dokumen per negara sebelum ceklisnya Anda impor.",
  },
  {
    Icon: Route,
    title: "Kejar skill yang masih kurang",
    body: "Roadmap skill memecah satu jalur karier menjadi langkah berurutan, lengkap dengan perkiraan jam belajar dan sumber belajarnya. Tandai yang sudah dikuasai, dan sisanya berubah menjadi daftar kerja yang konkret. Menjelang hari wawancara, latihan wawancara memberi Anda bank pertanyaan berbahasa Indonesia yang bisa disaring per kategori, masing-masing dengan contoh jawaban dan tips, plus timer per pertanyaan. Di akhir sesi Anda melihat berapa persen pertanyaan yang sudah Anda jawab — bukan nilai kualitas.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="cara-kerja"
      className="border-t border-border bg-background py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Bagaimana CareerPack bekerja
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Empat langkah, satu akun. Urutannya tidak mengikat — kebanyakan
            orang mulai dari CV, lalu menambahkan sisanya begitu lamaran pertama
            terkirim. Semua bagian memakai data yang sama, jadi pengalaman kerja
            yang Anda tulis sekali langsung dipakai ulang di CV berikutnya, di
            pemindai ATS, dan di halaman profil publik Anda.
          </p>
        </div>

        <ol className="mt-12 grid gap-8 sm:grid-cols-2">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"
                >
                  <step.Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium tabular-nums text-muted-foreground">
                  Langkah {i + 1}
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
