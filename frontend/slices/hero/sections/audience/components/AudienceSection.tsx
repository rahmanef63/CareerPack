import { GraduationCap, Plane, Repeat } from "lucide-react";
import type { ComponentType } from "react";

interface Audience {
  Icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}

/**
 * Three situations, written from what the product actually does for each.
 * No personas with names, no invented quotes, no "dipakai oleh N ribu orang"
 * — there is no number in this repo that would make that sentence true.
 */
const AUDIENCES: Audience[] = [
  {
    Icon: GraduationCap,
    title: "Fresh graduate",
    body: "Belum punya riwayat kerja untuk ditulis, tapi punya proyek kuliah, organisasi, magang, dan sertifikat. Editor CV menyediakan bagian khusus untuk proyek dan sertifikasi, dan skor kelengkapan menunjukkan bagian mana yang membuat CV terlihat kosong. Latihan wawancara memberi Anda ruang untuk gagal berkali-kali sebelum gagal di depan pewawancara sungguhan.",
  },
  {
    Icon: Repeat,
    title: "Pindah karier",
    body: "Sudah bekerja, ingin pindah bidang. Roadmap skill memperlihatkan jarak antara yang sudah Anda kuasai dan yang diminta bidang baru, pemindai ATS menunjukkan kata kunci yang belum muncul di CV Anda, dan generator surat lamaran menyusun draf yang menjelaskan perpindahan itu. Kalkulator kesiapan keuangan menghitung skor kesiapan serta selisih biaya hidup antar kota kalau langkahnya termasuk pindah domisili.",
  },
  {
    Icon: Plane,
    title: "Kerja ke luar negeri",
    body: "Bagian tersulit sering bukan wawancaranya, melainkan berkasnya. Ceklis per negara menyebut dokumen yang diminta beserta penerbitnya dan mengingatkan masa berlaku, format CV internasional menghapus foto dan data pribadi yang justru merugikan di banyak negara, dan seluruh aplikasi bisa diterjemahkan dengan satu ketukan saat Anda perlu menunjukkannya ke agen atau calon atasan.",
  },
];

/** Server Component — static copy, no interactivity, readable pre-hydration. */
export function AudienceSection() {
  return (
    <section
      id="untuk-siapa"
      className="border-t border-border bg-background py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Untuk siapa CareerPack dibuat
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Alatnya sama, tapi bagian yang paling menolong berbeda-beda
            tergantung posisi Anda sekarang.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {AUDIENCES.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <span
                aria-hidden
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand"
              >
                <item.Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </article>
          ))}
        </div>

        {/* Kept as prose, not a badge row: this is the one claim on the page
            that says what the product does NOT do, and a badge would bury it. */}
        <p className="mt-10 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          CareerPack tidak menjanjikan Anda mendapat pekerjaan — tidak ada alat
          yang bisa. Yang bisa dihapus adalah pekerjaan administratif di
          sekitarnya: CV yang rapi dan terbaca mesin, dokumen yang lengkap
          sebelum diminta, lamaran yang terpantau statusnya, dan latihan
          wawancara yang boleh diulang sesering yang Anda mau.
        </p>
      </div>
    </section>
  );
}
