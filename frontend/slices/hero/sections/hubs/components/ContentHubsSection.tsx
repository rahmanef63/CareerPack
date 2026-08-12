import Link from "next/link";
import { ArrowRight, Globe2, Route } from "lucide-react";

/**
 * One entry in either hub list. Deliberately a local, minimal shape rather
 * than a Convex row type: the slice must not depend on the backend's return
 * shape, and the route (`app/(marketing)/page.tsx`) is what fetches and maps.
 * `flag` is an emoji when the entry has one (country guides) and absent
 * otherwise (roadmaps).
 */
export interface HubLink {
  slug: string;
  label: string;
  flag?: string;
}

interface ContentHubsSectionProps {
  /** Country document guides → `/dokumen/<slug>`. Empty renders hub link only. */
  countries: readonly HubLink[];
  /** Learning roadmaps → `/roadmap/<slug>`. Empty renders hub link only. */
  roadmaps: readonly HubLink[];
}

const CHIP =
  "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card";

const HUB_LINK =
  "mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-4 decoration-brand/50 hover:decoration-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-sm";

/**
 * Server Component. The two public content hubs, plus a direct link to each
 * leaf page we know exists — this is the internal-linking path that makes
 * `/dokumen/<negara>` and `/roadmap/<slug>` crawlable from the homepage
 * instead of only from the sitemap.
 *
 * Both lists are PROPS, not a fetch performed here: the route already talks to
 * Convex (see `page.tsx`) and degrades to `[]` when the backend is unreachable
 * at build time. With empty lists this section still renders its prose and the
 * two hub links, so a Convex outage costs discoverability of the leaves and
 * nothing else.
 */
export function ContentHubsSection({ countries, roadmaps }: ContentHubsSectionProps) {
  return (
    <section
      id="panduan"
      className="border-t border-border bg-muted py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Baca dulu, daftar belakangan
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Dua bagian isi CareerPack terbuka untuk umum tanpa akun: panduan
            dokumen kerja per negara, dan roadmap belajar per jalur karier.
            Isinya sumber yang sama dengan yang dipakai di dalam aplikasi —
            bedanya, di dalam aplikasi setiap item bisa Anda centang, beri
            catatan, dan pantau masa berlakunya.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <span
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand"
            >
              <Globe2 className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-foreground">
              Panduan dokumen kerja luar negeri
            </h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              Sembilan negara tujuan, masing-masing dengan daftar berkas yang
              biasa diminta — dikelompokkan per jenis, sebagian dilengkapi
              lembaga penerbitnya (di Indonesia maupun di negara tujuan) dan
              masa berlakunya, dengan penanda mana yang wajib. Cocok dibaca
              sebelum Anda memutuskan menabung untuk legalisasi ijazah atau tes
              bahasa.
            </p>

            {countries.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {countries.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/dokumen/${c.slug}`} className={CHIP}>
                      {c.flag ? <span aria-hidden>{c.flag}</span> : null}
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            <Link href="/dokumen" className={HUB_LINK}>
              Lihat semua panduan dokumen
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <span
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand"
            >
              <Route className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-foreground">
              Roadmap belajar per profesi
            </h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              Puluhan jalur karier di bidang teknologi, bisnis, kreatif,
              pendidikan, kesehatan, keuangan, sumber daya manusia,
              pemerintahan, dan sosial. Tiap roadmap dipecah menjadi langkah
              belajar berurutan dengan perkiraan jam dan bahan bacaannya, jadi
              Anda tahu harus mulai dari mana, bukan hanya harus belajar apa.
            </p>

            {roadmaps.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {roadmaps.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/roadmap/${r.slug}`} className={CHIP}>
                      {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            <Link href="/roadmap" className={HUB_LINK}>
              Lihat semua roadmap
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
