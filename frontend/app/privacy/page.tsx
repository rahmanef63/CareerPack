import type { Metadata } from "next";
import { LegalHeader } from "@/shared/components/layout/LegalHeader";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Cara CareerPack mengumpulkan, menggunakan, dan melindungi data Anda.",
};

const LAST_UPDATED = "2026-07-30";

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
        kami menanganinya. Halaman ini adalah draft kerja yang diperbarui sesuai
        kebutuhan dan belum ditinjau penasihat hukum.
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
      <h2>Analitik</h2>
      <p>
        Kami memakai <strong>Google Analytics 4</strong> untuk menghitung
        pengunjung; GA4 menyimpan cookie <code>_ga</code> di browser Anda. Selain
        itu ada penghitung halaman milik kami sendiri yang mencatat path halaman,
        host perujuk, parameter UTM, ukuran layar, dan negara — negara diturunkan
        dari alamat IP saat permintaan masuk, lalu IP-nya dibuang dan tidak
        pernah disimpan. Analitik tidak berjalan di halaman dashboard maupun
        admin.
      </p>
      <h2>Yang TIDAK Kami Lakukan</h2>
      <ul>
        <li>Tidak menjual data ke pihak ketiga.</li>
        <li>Tidak ada iklan personalisasi maupun profil iklan.</li>
        <li>Tidak mengindeks halaman publik tanpa izin Anda (default opt-out).</li>
      </ul>
      <h2>Hak Anda</h2>
      {/* The self-serve delete now exists: Pengaturan → tab "Profil Akun" →
          Zona Berbahaya, calling api.profile.mutations.deleteMyAccount (same
          cascadeDeleteUser the admin path uses). Export is still genuinely
          manual, so that half stays an email promise — don't merge the two
          sentences back into one "hubungi kami" paragraph.
          "Kami tidak menyimpan salinan" would be false: scripts/backup-prod.sh
          exports every table + file storage nightly and keeps KEEP=14 archives,
          so an erased account survives there for up to two weeks. Say that
          instead of promising zero copies. */}
      <p>
        <strong>Hapus akun</strong>: buka Pengaturan → tab &quot;Profil
        Akun&quot; → Zona Berbahaya. Sekali dikonfirmasi, profil, CV, lamaran,
        roadmap, ceklis, agenda, kontak, riwayat AI, dan berkas unggahan Anda
        dihapus dari server saat itu juga — tidak bisa dibatalkan. Yang tersisa
        hanya cadangan harian internal kami, yang terhapus sendiri
        paling lama 14 hari dan tidak dipakai untuk memulihkan akun.
      </p>
      <p>
        <strong>Salinan data</strong>: masih manual. Email{" "}
        <a href="mailto:support@careerpack.org">support@careerpack.org</a> dari
        alamat email akun Anda dan kami kirimkan datanya — minta salinan
        sebelum menghapus akun, karena setelah dihapus tidak ada yang tersisa
        untuk dikirim.
      </p>
      <h2>Kontak</h2>
      {/* Was a link to /dashboard/help, which sits behind the auth guard — so
          the privacy policy told a prospective, account-less reader to ask their
          privacy question through a login wall. */}
      <p>
        Pertanyaan privasi:{" "}
        <a href="mailto:support@careerpack.org">support@careerpack.org</a>.
      </p>
    </main>
    </>
  );
}
