import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Globe2, ShieldAlert } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { JsonLd } from "@/shared/components/seo/JsonLd";
import { publicContentList } from "@/shared/lib/publicContentQuery";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { MarketingHeader } from "@/shared/components/layout/MarketingHeader";
import { MarketingFooter } from "@/shared/components/layout/MarketingFooter";

/**
 * /dokumen — public index of the country work-document guides.
 *
 * Lives OUTSIDE the (marketing) route group so it does not inherit that
 * layout's chrome implicitly; the header/footer are mounted here instead,
 * which keeps the page self-contained and its internal links crawlable.
 *
 * The data is the same admin-seeded `documentTemplates` the dashboard
 * checklist reads. Nothing on this page is generated, inferred, or padded —
 * every count comes off the row.
 *
 * ISR at 1 hour. If Convex is unreachable the page renders its empty state
 * rather than throwing: Dokploy builds straight off a push, so a backend
 * blip must never be able to fail a deploy.
 */

const SITE_URL = "https://careerpack.org";

export const revalidate = 3600;

const PAGE_TITLE = "Dokumen Kerja per Negara";
const PAGE_DESCRIPTION =
  "Daftar dokumen yang biasa diminta untuk bekerja di sembilan negara tujuan populer — dikelompokkan per jenis, sebagian dilengkapi instansi penerbit dan masa berlaku. Dikurasi tim CareerPack.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/dokumen" },
  openGraph: {
    title: `${PAGE_TITLE} · CareerPack`,
    description: PAGE_DESCRIPTION,
    type: "website",
    locale: "id_ID",
    siteName: "CareerPack",
    images: [{ url: "/og/og-card.jpg", width: 1200, height: 630, alt: "CareerPack" }],
    url: `${SITE_URL}/dokumen`,
  },
};

interface CountryGuideSummary {
  slug: string;
  country: string;
  countryLabel: string;
  flag: string;
  description: string;
  documentCount: number;
  requiredCount: number;
}

async function fetchGuides(): Promise<CountryGuideSummary[]> {
  return publicContentList<CountryGuideSummary>((client) =>
    client.query(api.documents.queries.listPublicCountryGuides, {}),
  );
}

export default async function DokumenIndexPage() {
  const guides = await fetchGuides();
  const totalDocuments = guides.reduce((sum, g) => sum + g.documentCount, 0);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Beranda",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Dokumen",
        item: `${SITE_URL}/dokumen`,
      },
    ],
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    numberOfItems: guides.length,
    itemListElement: guides.map((guide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `Dokumen kerja ${guide.countryLabel}`,
      url: `${SITE_URL}/dokumen/${guide.slug}`,
    })),
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <JsonLd data={breadcrumbLd} />
      {guides.length > 0 && <JsonLd data={itemListLd} />}
      <MarketingHeader />

      <main className="flex-1">
        {/* Intro band */}
        <section className="border-b border-border bg-gradient-to-b from-brand-muted/40 via-background to-background">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <nav aria-label="Remah roti" className="mb-6 text-xs text-muted-foreground">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link href="/" className="underline-offset-4 hover:underline">
                    Beranda
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-foreground">Dokumen</li>
              </ol>
            </nav>

            <Badge
              variant="secondary"
              className="mb-4 gap-1.5 rounded-full border border-brand/20 bg-brand-muted px-3 py-1 text-brand-muted-foreground"
            >
              <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
              {guides.length > 0 ? `${guides.length} negara` : "Panduan dokumen"}
            </Badge>

            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Dokumen Kerja per Negara
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/80 sm:text-lg">
              Pindah kerja ke luar negeri hampir selalu tersendat di hal yang
              sama: satu berkas ketinggalan, satu legalisir belum jalan, satu
              masa berlaku sudah lewat. Halaman ini merangkum dokumen yang
              biasa diminta di tiap negara tujuan — apa saja berkasnya, siapa
              yang menerbitkan, dan mana yang wajib versus tambahan — supaya
              Anda tahu apa yang harus disiapkan sebelum mulai melamar.
            </p>

            {totalDocuments > 0 && (
              <p className="mt-4 text-sm text-muted-foreground">
                {totalDocuments} dokumen terkurasi di {guides.length} negara.
                Gratis dibaca, tanpa perlu akun.
              </p>
            )}
          </div>
        </section>

        {/* Country grid */}
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Pilih negara tujuan
          </h2>

          {guides.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Daftar negara sedang tidak dapat dimuat. Coba muat ulang halaman
                ini beberapa saat lagi.
              </p>
            </div>
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/dokumen/${guide.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="flex items-center gap-3">
                      {guide.flag && (
                        <span className="text-3xl leading-none" aria-hidden="true">
                          {guide.flag}
                        </span>
                      )}
                      <h3 className="font-display text-xl font-semibold tracking-tight">
                        {guide.countryLabel}
                      </h3>
                    </div>

                    {guide.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/75">
                        {guide.description}
                      </p>
                    )}

                    <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                        <dt className="sr-only">Jumlah dokumen</dt>
                        <dd>{guide.documentCount} dokumen</dd>
                      </div>
                      <div>
                        <dt className="sr-only">Dokumen wajib</dt>
                        <dd>{guide.requiredCount} wajib</dd>
                      </div>
                    </dl>

                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
                      Lihat daftar dokumen
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Disclaimer */}
        <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="flex gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-5">
            <ShieldAlert
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-sm font-semibold">Sebelum Anda mulai</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
                Daftar di halaman ini adalah ceklis umum untuk membantu Anda
                bersiap, bukan nasihat hukum atau imigrasi. Aturan visa dan
                ketenagakerjaan berubah, dan syaratnya bisa berbeda menurut
                jenis izin, profesi, serta situasi pribadi Anda. Selalu
                konfirmasi ke kedutaan atau perwakilan resmi negara tujuan
                sebelum mengurus berkas.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-muted">
          <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Ingin mencentangnya satu per satu?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Buat akun gratis, pilih negara tujuan, dan daftar ini berubah jadi
              ceklis pribadi lengkap dengan catatan dan pengingat masa berlaku.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-6 bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground hover:from-brand-from/90 hover:to-brand-to/90"
            >
              <Link href="/login">Mulai Gratis</Link>
            </Button>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
