import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarClock,
  Info,
  ShieldAlert,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { JsonLd } from "@/shared/components/seo/JsonLd";
import { publicContentQuery, publicContentList } from "@/shared/lib/publicContentQuery";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { MarketingHeader } from "@/shared/components/layout/MarketingHeader";
import { MarketingFooter } from "@/shared/components/layout/MarketingFooter";

/**
 * /dokumen/[slug] — one country's work-document guide, rendered from the
 * admin-seeded `documentTemplates` row.
 *
 * CONTENT RULE for anyone editing this file: every factual claim on the page
 * must come out of a field on the row. Document titles, descriptions,
 * issuing authorities, validity periods and notes are printed verbatim and
 * are never paraphrased, merged, expanded or "clarified" here. The only copy
 * authored in this file is framing — headings, the intro sentence, the
 * category labels, and the disclaimer. If a requirement looks wrong, fix the
 * seed, not the page.
 *
 * ISR at 1 hour; `generateStaticParams` degrades to [] when Convex is
 * unreachable so a backend blip cannot fail a Dokploy build — the pages then
 * render on demand instead of being prerendered.
 */

const SITE_URL = "https://careerpack.org";

export const revalidate = 3600;

interface GuideDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  required: boolean;
  issuingAuthority?: string;
  validityYears?: number;
  notes?: string;
}

interface CountryGuide {
  slug: string;
  country: string;
  countryLabel: string;
  flag?: string;
  description?: string;
  documents: GuideDocument[];
}

/**
 * Display labels for the `category` keys used by the seeds. Purely a
 * grouping heading — it renames nothing about the documents themselves.
 * An unmapped key falls back to the raw value with its first letter
 * capitalised, so a new category shows up readably instead of vanishing.
 */
const CATEGORY_LABELS: Record<string, string> = {
  visa: "Visa & Izin",
  identity: "Identitas",
  education: "Pendidikan",
  qualification: "Kualifikasi",
  employment: "Ketenagakerjaan",
  career: "Berkas Karier",
  language: "Bahasa",
  health: "Kesehatan",
  insurance: "Asuransi",
  financial: "Keuangan",
  legal: "Legal",
  travel: "Perjalanan",
  settlement: "Menetap",
};

function categoryLabel(category: string): string {
  return (
    CATEGORY_LABELS[category] ??
    category.charAt(0).toUpperCase() + category.slice(1)
  );
}

function categoryAnchor(category: string): string {
  return `kategori-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

/**
 * Group by `category` in FIRST-APPEARANCE order. The seed order is curated
 * (roughly the order you would actually chase the paperwork in), so it is
 * preserved rather than re-sorted alphabetically or required-first.
 */
function groupByCategory(documents: GuideDocument[]) {
  const groups: { category: string; documents: GuideDocument[] }[] = [];
  for (const doc of documents) {
    const existing = groups.find((g) => g.category === doc.category);
    if (existing) existing.documents.push(doc);
    else groups.push({ category: doc.category, documents: [doc] });
  }
  return groups;
}

/**
 * `cache` dedupes the read between `generateMetadata` and the page body — both
 * run per render, and `ConvexHttpClient` POSTs, which Next's fetch memoization
 * never dedupes. Without it every guide costs two identical round trips.
 */
const fetchGuide = cache(async (slug: string): Promise<CountryGuide | null> => {
  const row = await publicContentQuery(
    (client) => client.query(api.documents.queries.getPublicCountryGuide, { slug }),
    null,
  );
  if (!row || !Array.isArray(row.documents)) return null;
  return row as CountryGuide;
});

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  // Convex down at build time is not a build failure — the routes stay dynamic
  // and get rendered (then cached) on first request.
  const guides = await publicContentList<{ slug: string }>((client) =>
    client.query(api.documents.queries.listPublicCountryGuides, {}),
  );
  return guides.map((guide) => ({ slug: guide.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await fetchGuide(slug);

  if (!guide) {
    return {
      title: "Panduan dokumen tidak ditemukan",
      robots: { index: false, follow: false },
    };
  }

  const requiredCount = guide.documents.filter((d) => d.required).length;
  const description =
    guide.description ||
    `${guide.documents.length} dokumen yang biasa diminta untuk bekerja di ${guide.countryLabel}, ${requiredCount} di antaranya wajib.`;
  const title = `Dokumen Kerja di ${guide.countryLabel}`;
  const url = `${SITE_URL}/dokumen/${guide.slug}`;

  return {
    title,
    description,
    alternates: { canonical: `/dokumen/${guide.slug}` },
    openGraph: {
      title: `${title} · CareerPack`,
      description,
      type: "article",
      url,
      // Restated, not inherited. Next merges metadata shallowly: a page that
      // declares `openGraph` replaces the root layout's object outright, so
      // omitting these ships the page with no og:image, og:site_name or
      // og:locale — every share of a country guide unfurls as bare text.
      locale: "id_ID",
      siteName: "CareerPack",
      images: [{ url: "/og/og-card.jpg", width: 1200, height: 630, alt: "CareerPack" }],
    },
  };
}

export default async function CountryGuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = await fetchGuide(slug);
  if (!guide) notFound();

  const requiredCount = guide.documents.filter((d) => d.required).length;
  const optionalCount = guide.documents.length - requiredCount;
  const groups = groupByCategory(guide.documents);
  const url = `${SITE_URL}/dokumen/${guide.slug}`;
  const description =
    guide.description ||
    `${guide.documents.length} dokumen yang biasa diminta untuk bekerja di ${guide.countryLabel}.`;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Dokumen Kerja di ${guide.countryLabel}`,
    description,
    inLanguage: "id-ID",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    about: { "@type": "Country", name: guide.countryLabel },
    author: { "@type": "Organization", name: "CareerPack", url: SITE_URL },
    publisher: { "@type": "Organization", name: "CareerPack", url: SITE_URL },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Dokumen",
        item: `${SITE_URL}/dokumen`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.countryLabel,
        item: url,
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <JsonLd data={articleLd} />
      <JsonLd data={breadcrumbLd} />
      <MarketingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-brand-muted/40 via-background to-background">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <nav aria-label="Remah roti" className="mb-6 text-xs text-muted-foreground">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link href="/" className="inline-block py-1.5 underline-offset-4 hover:underline">
                    Beranda
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href="/dokumen" className="inline-block py-1.5 underline-offset-4 hover:underline">
                    Dokumen
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-foreground">{guide.countryLabel}</li>
              </ol>
            </nav>

            <div className="flex items-center gap-4">
              {guide.flag && (
                <span className="text-5xl leading-none sm:text-6xl" aria-hidden="true">
                  {guide.flag}
                </span>
              )}
              <h1 className="font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
                Dokumen Kerja di {guide.countryLabel}
              </h1>
            </div>

            {guide.description && (
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/80 sm:text-lg">
                {guide.description}
              </p>
            )}

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Berikut daftar berkas yang biasa diminta, dikelompokkan per
              kategori. Tiap entri mencantumkan instansi penerbit dan masa
              berlaku bila datanya tersedia, serta ditandai wajib atau
              tambahan.
            </p>

            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Total dokumen
                </dt>
                <dd className="font-display text-2xl font-semibold">
                  {guide.documents.length}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Wajib
                </dt>
                <dd className="font-display text-2xl font-semibold text-brand">
                  {requiredCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Tambahan
                </dt>
                <dd className="font-display text-2xl font-semibold">
                  {optionalCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Kategori
                </dt>
                <dd className="font-display text-2xl font-semibold">
                  {groups.length}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          {/* Disclaimer — above the list on purpose. */}
          <div className="flex gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-5">
            <ShieldAlert
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-sm font-semibold">Baca ini dulu</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
                Daftar ini adalah ceklis umum untuk membantu Anda bersiap, bukan
                nasihat hukum atau imigrasi. Aturan visa dan ketenagakerjaan
                dapat berubah sewaktu-waktu, dan persyaratannya bisa berbeda
                menurut jenis izin, profesi, pemberi kerja, serta situasi
                pribadi Anda. Selalu verifikasi ke kedutaan atau perwakilan
                resmi {guide.countryLabel} sebelum mengurus berkas apa pun.
              </p>
            </div>
          </div>

          {/* Category jump list */}
          {groups.length > 1 && (
            <nav aria-label="Daftar kategori" className="mt-10">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Daftar isi
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {groups.map((group) => (
                  <li key={group.category}>
                    <a
                      href={`#${categoryAnchor(group.category)}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:border-brand/40 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      {categoryLabel(group.category)}
                      <span className="text-xs text-muted-foreground">
                        {group.documents.length}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* The documents */}
          <div className="mt-10 space-y-12">
            {groups.map((group) => (
              <section
                key={group.category}
                id={categoryAnchor(group.category)}
                className="scroll-mt-20"
              >
                <header className="border-b border-border pb-3">
                  <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                    {categoryLabel(group.category)}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {group.documents.length} dokumen ·{" "}
                    {group.documents.filter((d) => d.required).length} wajib
                  </p>
                </header>

                <ul className="mt-5 space-y-4">
                  {group.documents.map((doc) => (
                    <li
                      key={doc.id}
                      className={
                        doc.required
                          ? "rounded-2xl border border-brand/25 bg-card p-5"
                          : "rounded-2xl border border-dashed border-border bg-card/50 p-5"
                      }
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h3 className="font-display text-lg font-semibold leading-snug">
                          {doc.title}
                        </h3>
                        {doc.required ? (
                          <Badge className="gap-1 border border-brand/30 bg-brand-muted text-brand-muted-foreground">
                            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            Wajib
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Tambahan
                          </Badge>
                        )}
                      </div>

                      {doc.subcategory && (
                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                          {doc.subcategory}
                        </p>
                      )}

                      <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                        {doc.description}
                      </p>

                      {(doc.issuingAuthority || doc.validityYears) && (
                        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                          {doc.issuingAuthority && (
                            <div className="flex items-start gap-1.5">
                              <Building2
                                className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground"
                                aria-hidden="true"
                              />
                              <dt className="sr-only">Instansi penerbit</dt>
                              <dd className="text-foreground/75">
                                {doc.issuingAuthority}
                              </dd>
                            </div>
                          )}
                          {doc.validityYears !== undefined && (
                            <div className="flex items-start gap-1.5">
                              <CalendarClock
                                className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground"
                                aria-hidden="true"
                              />
                              <dt className="sr-only">Masa berlaku</dt>
                              <dd className="text-foreground/75">
                                Masa berlaku {doc.validityYears} tahun
                              </dd>
                            </div>
                          )}
                        </dl>
                      )}

                      {doc.notes && (
                        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-muted/60 p-3 text-sm leading-relaxed text-foreground/75">
                          <Info
                            className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <span>{doc.notes}</span>
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-12 border-t border-border pt-6">
            <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
              <Link href="/dokumen">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Semua negara
              </Link>
            </Button>
          </div>
        </article>

        {/* CTA */}
        <section className="border-t border-border bg-muted">
          <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Jadikan ini ceklis pribadi Anda
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Buat akun gratis, pilih {guide.countryLabel} sebagai negara
              tujuan, lalu centang tiap berkas sambil menyimpan catatan dan
              tanggal kedaluwarsanya.
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
