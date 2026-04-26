import type { Metadata } from "next";
import Link from "next/link";
import { LegalHeader } from "@/shared/components/layout/LegalHeader";

export const metadata: Metadata = {
  title: "Syarat Layanan",
  description: "Syarat penggunaan layanan CareerPack.",
};

const LAST_UPDATED = "2026-04-25";

export default function TermsPage() {
  return (
    <>
    <LegalHeader />
    <main className="mx-auto max-w-3xl px-4 py-12 prose prose-sm dark:prose-invert">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Syarat Layanan
      </h1>
      <p className="text-xs text-muted-foreground">
        Terakhir diperbarui: {LAST_UPDATED}
      </p>
      <p>
        Dokumen ini adalah versi kerja. Versi final akan ditinjau oleh penasihat
        hukum sebelum produk publik penuh.
      </p>
      <h2>Penggunaan yang Diizinkan</h2>
      <ul>
        <li>Akun pribadi untuk mengelola karir Anda sendiri.</li>
        <li>
          Sesi demo (anonim) diperbolehkan untuk mengevaluasi fitur — data
          demo bersifat ephemeral.
        </li>
        <li>
          Halaman publik /[slug] hanya untuk profil profesional pemilik akun.
          Tidak untuk impersonation atau konten ofensif.
        </li>
      </ul>
      <h2>Penggunaan AI</h2>
      <p>
        Asisten AI memberi saran, bukan nasihat profesional. Verifikasi semua
        output sebelum digunakan untuk keputusan karir, hukum, atau finansial.
        Rate limit berlaku untuk mencegah penyalahgunaan.
      </p>
      <h2>Konten Pengguna</h2>
      <p>
        Anda mempertahankan hak penuh atas data yang Anda buat (CV, portofolio,
        catatan). CareerPack hanya memproses data ini untuk menyediakan
        layanan kepada Anda.
      </p>
      <h2>Penghentian Layanan</h2>
      <p>
        Akun yang melanggar (spam, scraping massif, penyalahgunaan AI quota)
        dapat di-suspend tanpa pemberitahuan. Akun normal dapat dihapus oleh
        pengguna kapan saja melalui{" "}
        <Link href="/dashboard/settings">Pengaturan</Link>.
      </p>
      <h2>Tanggung Jawab</h2>
      <p>
        Layanan disediakan apa adanya. Tidak ada jaminan bahwa Anda akan
        mendapat pekerjaan. CareerPack adalah alat bantu — keputusan akhir
        tetap milik Anda.
      </p>
      <h2>Kontak</h2>
      <p>
        Pertanyaan: gunakan formulir di{" "}
        <Link href="/dashboard/help">Pusat Bantuan</Link>.
      </p>
    </main>
    </>
  );
}
