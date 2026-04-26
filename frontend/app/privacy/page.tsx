import type { Metadata } from "next";
import Link from "next/link";
import { LegalHeader } from "@/shared/components/layout/LegalHeader";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Cara CareerPack mengumpulkan, menggunakan, dan melindungi data Anda.",
};

const LAST_UPDATED = "2026-04-25";

export default function PrivacyPage() {
  return (
    <>
    <LegalHeader />
    <main className="mx-auto max-w-3xl px-4 py-12 prose prose-sm dark:prose-invert">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Kebijakan Privasi
      </h1>
      <p className="text-xs text-muted-foreground">
        Terakhir diperbarui: {LAST_UPDATED}
      </p>
      <p>
        Dokumen ini menjelaskan data apa yang CareerPack kumpulkan dan bagaimana
        kami menanganinya. Versi final akan ditinjau oleh penasihat hukum
        sebelum produk publik penuh; halaman ini adalah draft kerja yang
        diperbarui sesuai kebutuhan.
      </p>
      <h2>Data yang Kami Simpan</h2>
      <ul>
        <li>
          <strong>Akun</strong>: email + kata sandi yang di-hash (PBKDF2-SHA256
          100k iterasi). Untuk sesi demo, akun anonim tanpa email.
        </li>
        <li>
          <strong>Profil &amp; CV</strong>: nama, kontak, pengalaman kerja,
          keterampilan, foto formal (opsional). Hanya dibagikan ke publik jika
          Anda mengaktifkan halaman /[slug] di Pengaturan.
        </li>
        <li>
          <strong>Data fungsional</strong>: lamaran, ceklis dokumen, roadmap
          skill, agenda, kontak networking. Hanya Anda yang dapat membaca/menulis.
        </li>
        <li>
          <strong>Permintaan AI</strong>: prompt yang Anda kirim ke Asisten AI
          dilewatkan ke penyedia (OpenAI-compatible) dengan rate-limit
          10/menit, 100/hari. Riwayat percakapan disimpan di akun Anda.
        </li>
      </ul>
      <h2>Yang TIDAK Kami Lakukan</h2>
      <ul>
        <li>Tidak menjual data ke pihak ketiga.</li>
        <li>Tidak ada iklan personalisasi (tidak ada tracker pihak ketiga).</li>
        <li>Tidak mengindeks halaman publik tanpa izin Anda (default opt-out).</li>
      </ul>
      <h2>Hak Anda</h2>
      <p>
        Anda dapat menghapus akun + semua data terkait kapan saja melalui{" "}
        <Link href="/dashboard/settings">Pengaturan</Link>. Permintaan ekspor
        data manual tersedia via{" "}
        <Link href="/dashboard/help">Pusat Bantuan</Link>.
      </p>
      <h2>Kontak</h2>
      <p>
        Pertanyaan privasi: gunakan formulir di{" "}
        <Link href="/dashboard/help">Pusat Bantuan</Link>.
      </p>
    </main>
    </>
  );
}
