import type { Metadata } from "next";
import { LegalHeader } from "@/shared/components/layout/LegalHeader";

export const metadata: Metadata = {
  title: "Privacy Policy / Kebijakan Privasi",
  description: "Cara CareerPack mengumpulkan, menggunakan, membagikan, dan melindungi data pengguna.",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "18 September 2026";

export default function PrivacyPage() {
  return (
    <>
      <LegalHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 prose prose-sm dark:prose-invert">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Privacy Policy / Kebijakan Privasi
        </h1>
        <p className="text-xs text-muted-foreground">
          Terakhir diperbarui: {LAST_UPDATED}
        </p>
        <p>
          Kebijakan ini menjelaskan data yang diproses CareerPack, untuk tujuan apa,
          kapan data dapat diteruskan ke layanan lain, dan kontrol yang tersedia bagi
          pengguna.
        </p>

        <h2>Domain Resmi CareerPack</h2>
        <p>
          Antarmuka pengguna dan layar OAuth utama berada di <code>careerpack.org</code>.
          Backend aplikasi menggunakan <code>api.careerpack.org</code>, sedangkan HTTP
          actions, metadata OAuth/MCP, dan registrasi klien menggunakan{" "}
          <code>site.careerpack.org</code>. Ketiganya adalah custom domain CareerPack.
          Pada alur OAuth ke aplikasi pihak ketiga, browser dapat diarahkan ke domain
          aplikasi tersebut setelah Anda menyetujui akses; domain tujuan ditampilkan
          pada layar persetujuan sebelum Anda melanjutkan.
        </p>

        <h2>Data yang Kami Simpan</h2>
        <ul>
          <li>
            <strong>Akun</strong>: email, nama, dan kredensial yang diperlukan untuk
            autentikasi. Kata sandi disimpan dalam bentuk hash, bukan teks asli.
          </li>
          <li>
            <strong>Google Sign-In</strong>: jika Anda memilih masuk dengan Google,
            CareerPack menerima data akun dasar yang Google berikan untuk login,
            seperti email, nama, dan foto profil bila tersedia. Data ini digunakan
            untuk autentikasi dan identitas akun CareerPack.
          </li>
          <li>
            <strong>Profil &amp; CV</strong>: data profesional, pengalaman, pendidikan,
            keterampilan, kontak, dan media yang Anda pilih untuk unggah. Data hanya
            menjadi publik jika Anda mengaktifkan halaman profil publik.
          </li>
          <li>
            <strong>Data fungsional</strong>: lamaran, checklist dokumen, roadmap,
            agenda, kontak networking, hasil latihan, dan konfigurasi fitur lain yang
            Anda simpan.
          </li>
          <li>
            <strong>Koneksi OAuth/MCP</strong>: metadata yang diperlukan untuk koneksi
            seperti client ID, redirect URI, scope, waktu pembuatan, serta token akses
            yang diterbitkan. Koneksi dan token dapat dicabut dari Pengaturan.
          </li>
        </ul>

        <h2>Bagaimana Data Digunakan</h2>
        <p>
          Data digunakan untuk menjalankan akun, menghasilkan CV dan halaman profil,
          membantu pencarian dan perencanaan karier, menjalankan fitur AI, menjaga
          keamanan, serta menyediakan integrasi yang secara eksplisit Anda aktifkan.
          Data Google Sign-In tidak dijual dan tidak digunakan untuk iklan.
        </p>

        <h2>Fitur AI dan Penyedia Pihak Ketiga</h2>
        <p>
          Saat Anda memakai fitur AI, prompt dan konteks yang diperlukan dapat dikirim
          ke penyedia AI yang dikonfigurasi untuk memproses permintaan tersebut. Jangan
          memasukkan data yang tidak diperlukan. Penggunaan data oleh penyedia eksternal
          juga mengikuti kebijakan penyedia tersebut.
        </p>

        <h2>OAuth ke Aplikasi Lain</h2>
        <p>
          Ketika Anda menghubungkan CareerPack ke aplikasi seperti klien MCP, layar
          persetujuan menunjukkan data atau scope yang diminta dan domain redirect
          tujuan. CareerPack hanya mengirim kode otorisasi ke redirect URI yang lolos
          validasi. Setelah aplikasi menukar kode itu dengan token, aplikasi tersebut
          dapat mengakses data sesuai scope yang Anda setujui sampai akses dicabut.
        </p>

        <h2>Analitik</h2>
        <p>
          CareerPack menggunakan Google Analytics 4 pada halaman publik untuk mengukur
          penggunaan situs. GA4 dapat menyimpan cookie seperti <code>_ga</code>. Kami juga
          memiliki analitik internal yang dapat mencatat path halaman, host perujuk, UTM,
          ukuran layar, dan negara. Negara dapat diturunkan dari alamat IP saat request
          diproses; alamat IP mentah tidak disimpan sebagai data analitik. Analitik tidak
          dijalankan pada dashboard dan admin.
        </p>

        <h2>Yang Tidak Kami Lakukan</h2>
        <ul>
          <li>Tidak menjual data pribadi kepada pengiklan atau data broker.</li>
          <li>Tidak menggunakan data Google Sign-In untuk iklan personalisasi.</li>
          <li>Tidak mempublikasikan profil Anda tanpa pilihan publikasi dari Anda.</li>
        </ul>

        <h2>Kontrol dan Hak Anda</h2>
        <p>
          <strong>Cabut koneksi:</strong> koneksi OAuth/MCP dan API key dapat ditinjau
          serta dicabut dari Pengaturan CareerPack. Akses Google juga dapat dicabut dari
          pengaturan keamanan akun Google Anda.
        </p>
        <p>
          <strong>Hapus akun:</strong> buka Pengaturan → Profil Akun → Zona Berbahaya.
          Data akun aktif dihapus ketika permintaan dikonfirmasi. Cadangan internal
          bergulir dapat mempertahankan salinan untuk maksimal 14 hari sebelum terhapus
          otomatis dan tidak digunakan untuk memulihkan akun yang telah dihapus.
        </p>
        <p>
          <strong>Salinan data:</strong> email{" "}
          <a href="mailto:support@careerpack.org">support@careerpack.org</a> dari alamat
          akun Anda sebelum menghapus akun jika Anda membutuhkan salinan data.
        </p>

        <h2>Keamanan</h2>
        <p>
          CareerPack menggunakan kontrol autentikasi, pembatasan akses per pengguna,
          validasi redirect OAuth, rate limit, dan mekanisme pencabutan token. Tidak ada
          sistem yang dapat menjamin keamanan absolut, sehingga pengguna juga perlu
          menjaga keamanan akun dan perangkatnya.
        </p>

        <h2>Perubahan Kebijakan</h2>
        <p>
          Kebijakan ini dapat diperbarui saat fitur, penyedia, atau praktik data berubah.
          Tanggal pembaruan terbaru selalu ditampilkan di bagian atas halaman.
        </p>

        <h2>Kontak</h2>
        <p>
          Pertanyaan privasi:{" "}
          <a href="mailto:support@careerpack.org">support@careerpack.org</a>.
        </p>
      </main>
    </>
  );
}
