import type { Metadata } from "next";
import Link from "next/link";
import { LegalHeader } from "@/shared/components/layout/LegalHeader";

export const metadata: Metadata = {
  title: "Terms of Service / Syarat Layanan",
  description: "Syarat penggunaan CareerPack, termasuk akun, AI, OAuth, dan integrasi pihak ketiga.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "18 September 2026";

export default function TermsPage() {
  return (
    <>
      <LegalHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 prose prose-sm dark:prose-invert">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Terms of Service / Syarat Layanan
        </h1>
        <p className="text-xs text-muted-foreground">
          Terakhir diperbarui: {LAST_UPDATED}
        </p>
        <p>
          Syarat ini mengatur penggunaan CareerPack, termasuk situs, dashboard,
          fitur AI, halaman profil publik, serta koneksi OAuth/MCP. Dengan membuat
          akun atau menggunakan layanan, Anda setuju menggunakan CareerPack sesuai
          ketentuan di bawah ini.
        </p>

        <h2>Akun dan Penggunaan yang Diizinkan</h2>
        <ul>
          <li>Akun digunakan untuk mengelola data karier milik Anda sendiri.</li>
          <li>Sesi demo bersifat sementara dan ditujukan untuk mengevaluasi fitur.</li>
          <li>
            Halaman publik <code>/[slug]</code> hanya boleh digunakan untuk profil
            profesional yang sah dan tidak boleh digunakan untuk impersonation,
            phishing, spam, atau konten yang melanggar hukum.
          </li>
        </ul>

        <h2>OAuth, Redirect, dan Integrasi Pihak Ketiga</h2>
        <p>
          Alur otorisasi browser CareerPack menggunakan domain resmi{" "}
          <code>careerpack.org</code>. Layanan backend dan metadata OAuth/MCP
          menggunakan custom domain <code>api.careerpack.org</code> dan{" "}
          <code>site.careerpack.org</code>. Setelah Anda memberi izin kepada aplikasi
          lain, kode otorisasi hanya dikirim ke <code>redirect_uri</code> yang telah
          didaftarkan atau diizinkan untuk aplikasi tersebut.
        </p>
        <p>
          Selalu periksa domain tujuan pada layar persetujuan sebelum menekan
          Izinkan. Aplikasi pihak ketiga memiliki kebijakan dan syaratnya sendiri;
          CareerPack tidak mengendalikan penggunaan data oleh aplikasi tersebut
          setelah data dikirim berdasarkan izin yang Anda berikan. Koneksi aktif
          dapat ditinjau dan dicabut dari Pengaturan CareerPack.
        </p>

        <h2>Penggunaan AI</h2>
        <p>
          Fitur AI membantu menyusun, meninjau, dan menganalisis materi karier.
          Output AI dapat salah atau tidak lengkap dan bukan nasihat hukum,
          finansial, imigrasi, atau keputusan perekrutan. Verifikasi informasi
          penting sebelum menggunakannya.
        </p>

        <h2>Konten dan Data Pengguna</h2>
        <p>
          Anda tetap memiliki konten yang Anda masukkan ke CareerPack, termasuk
          CV, portofolio, catatan, dan dokumen. Anda memberi CareerPack izin yang
          diperlukan untuk memproses data tersebut hanya sejauh diperlukan untuk
          menjalankan fitur yang Anda gunakan. Detail pemrosesan data dijelaskan
          dalam <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <h2>Larangan Penyalahgunaan</h2>
        <p>
          Anda tidak boleh mencoba mengakses akun orang lain, menghindari kontrol
          keamanan atau rate limit, melakukan scraping abusif, menyebarkan malware,
          atau menggunakan CareerPack untuk aktivitas ilegal. Akses dapat dibatasi
          atau dihentikan bila diperlukan untuk melindungi pengguna dan layanan.
        </p>

        <h2>Penghapusan Akun dan Penghentian</h2>
        <p>
          Anda dapat menghapus akun melalui{" "}
          <Link href="/dashboard/settings">Pengaturan</Link>. Penghapusan akun dan
          retensi cadangan dijelaskan lebih rinci dalam Privacy Policy.
        </p>

        <h2>Ketersediaan dan Tanggung Jawab</h2>
        <p>
          CareerPack disediakan sebagaimana adanya dan dapat berubah dari waktu ke
          waktu. Kami tidak menjamin hasil karier tertentu, keberhasilan lamaran,
          atau ketersediaan tanpa gangguan. Keputusan akhir tetap berada pada Anda.
        </p>

        <h2>Perubahan Syarat</h2>
        <p>
          Syarat dapat diperbarui ketika fitur, integrasi, atau kewajiban operasional
          berubah. Tanggal pembaruan terbaru selalu ditampilkan pada halaman ini.
        </p>

        <h2>Kontak</h2>
        <p>
          Pertanyaan mengenai layanan:{" "}
          <a href="mailto:support@careerpack.org">support@careerpack.org</a>.
        </p>
      </main>
    </>
  );
}
