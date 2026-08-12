import type { Metadata } from "next";
import type { ElementType } from "react";
import Link from "next/link";
import { ArrowRight, BedDouble, BookOpen, Clock, Layers, Sparkles } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { JsonLd } from "@/shared/components/seo/JsonLd";
import { publicContentList } from "@/shared/lib/publicContentQuery";
import { MarketingHeader } from "@/shared/components/layout/MarketingHeader";
import { MarketingFooter } from "@/shared/components/layout/MarketingFooter";
import { ParangPattern } from "@/shared/components/decor/ParangPattern";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { DOMAIN_LABELS, iconMap } from "@/slices/skill-roadmap/constants/builder";

/**
 * /roadmap — the public index of every `isPublic` roadmapTemplates row.
 *
 * These roadmaps are ~10k words of curated Indonesian curriculum that until
 * now only existed behind the login wall, so nothing on this page is
 * invented: every title, description, hour count and tag is rendered
 * straight off the row. The framing copy around them is ours; the
 * curriculum claims are the data's.
 *
 * ISR at 1 hour — the catalog changes when an admin seeds or a user
 * publishes, which is nowhere near request rate. If Convex is unreachable
 * (Dokploy builds straight off a push, with no guarantee the backend is up)
 * the fetch degrades to an empty list and the page still renders, rather
 * than failing the build.
 */
export const revalidate = 3600;

const SITE_URL = "https://careerpack.org";

const PAGE_TITLE = "Roadmap Skill & Karir";
const PAGE_DESCRIPTION =
  "Kumpulan roadmap belajar untuk puluhan jalur karir — teknologi, bisnis, kreatif, kesehatan, keuangan, dan lainnya. Setiap roadmap berisi urutan materi, perkiraan jam belajar, dan sumber belajar gratis maupun berbayar.";

/**
 * Tailwind JIT only generates classes it can see as literals in the scanned
 * source (`content` globs cover app/, slices/, shared/ — not the database).
 * The row's `color` arrives as e.g. "bg-blue-500" from Convex, so using it
 * directly would render an unstyled tile in production. Map the colour
 * FAMILY onto a literal that exists right here instead.
 */
const ACCENT_CLASS: Record<string, string> = {
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  cyan: "bg-cyan-500",
  emerald: "bg-emerald-500",
  fuchsia: "bg-fuchsia-500",
  green: "bg-green-500",
  indigo: "bg-indigo-500",
  lime: "bg-lime-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  purple: "bg-purple-500",
  red: "bg-red-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
  slate: "bg-slate-500",
  stone: "bg-stone-500",
  teal: "bg-teal-500",
  violet: "bg-violet-500",
  yellow: "bg-yellow-500",
};

function accentClass(color: string): string {
  // "bg-blue-500" → "blue"; anything unrecognised falls back to the brand.
  const family = color.split("-")[1] ?? "";
  return ACCENT_CLASS[family] ?? "bg-brand";
}

/**
 * `iconMap` is the app's existing icon-name → component registry. Two seeded
 * roadmaps ship icons it does not carry, so they are merged in here rather
 * than editing a slice constant that the dashboard also reads.
 */
const ICONS: Record<string, ElementType> = { ...iconMap, BedDouble, Sparkles };

type RoadmapCard = {
  slug: string;
  title: string;
  description: string;
  domain: string;
  icon: string;
  color: string;
  tags: string[];
  nodeCount: number;
  totalHours: number;
};

async function fetchRoadmaps(): Promise<RoadmapCard[]> {
  return publicContentList<RoadmapCard>((client) =>
    client.query(api.roadmap.queries.listPublicRoadmaps, {}),
  );
}

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/roadmap" },
  openGraph: {
    // Next replaces the parent `openGraph` object wholesale rather than
    // merging it, so the share image has to be restated or the unfurl
    // loses the card the root layout set up.
    type: "website",
    locale: "id_ID",
    siteName: "CareerPack",
    url: `${SITE_URL}/roadmap`,
    title: `${PAGE_TITLE} · CareerPack`,
    description: PAGE_DESCRIPTION,
    images: [{ url: "/og/og-card.jpg", width: 1200, height: 630, alt: "CareerPack" }],
  },
};

function formatNumber(n: number): string {
  return n.toLocaleString("id-ID");
}

/**
 * Group by `domain`, in the order `DOMAIN_LABELS` declares (which is the
 * order the dashboard browser uses). Domains the label map does not know
 * about are appended rather than dropped, so a new seed domain still shows
 * up on the public page before anyone remembers to add a label.
 */
function groupByDomain(items: RoadmapCard[]): Array<{ domain: string; label: string; items: RoadmapCard[] }> {
  const buckets = new Map<string, RoadmapCard[]>();
  for (const item of items) {
    const list = buckets.get(item.domain);
    if (list) list.push(item);
    else buckets.set(item.domain, [item]);
  }
  const known = Object.keys(DOMAIN_LABELS).filter((d) => buckets.has(d));
  const unknown = [...buckets.keys()].filter((d) => !(d in DOMAIN_LABELS));
  return [...known, ...unknown].map((domain) => ({
    domain,
    label: DOMAIN_LABELS[domain] ?? domain,
    items: buckets.get(domain) ?? [],
  }));
}

export default async function RoadmapIndexPage() {
  const roadmaps = await fetchRoadmaps();
  const groups = groupByDomain(roadmaps);
  const totalNodes = roadmaps.reduce((sum, r) => sum + r.nodeCount, 0);
  const totalHours = roadmaps.reduce((sum, r) => sum + r.totalHours, 0);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Roadmap", item: `${SITE_URL}/roadmap` },
    ],
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    numberOfItems: roadmaps.length,
    itemListElement: roadmaps.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: r.title,
      url: `${SITE_URL}/roadmap/${r.slug}`,
    })),
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <JsonLd data={breadcrumbLd} />
      {roadmaps.length > 0 && <JsonLd data={itemListLd} />}
      <MarketingHeader />

      <main className="flex-1">
        {/* Hero band — batik texture + brand wash, same vocabulary as the
            landing hero and the public profile page. */}
        <section className="relative isolate overflow-hidden border-b border-border/60 bg-gradient-to-b from-brand-muted/40 via-background to-background">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <ParangPattern className="text-brand/20" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <nav aria-label="Jejak navigasi" className="mb-6">
              <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <li>
                  <Link href="/" className="underline-offset-4 hover:text-foreground hover:underline">
                    Beranda
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li className="font-medium text-foreground" aria-current="page">
                  Roadmap
                </li>
              </ol>
            </nav>

            <h1 className="font-display text-balance text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
              Roadmap Skill &amp;{" "}
              <span className="relative inline-block">
                <span className="relative z-10">Karir.</span>
                <span aria-hidden className="absolute inset-x-0 bottom-1 -z-0 h-[0.3em] -rotate-1 bg-primary/25" />
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {PAGE_DESCRIPTION}
            </p>

            {roadmaps.length > 0 && (
              <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Roadmap</dt>
                  <dd className="font-display text-2xl font-semibold">{formatNumber(roadmaps.length)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Materi</dt>
                  <dd className="font-display text-2xl font-semibold">{formatNumber(totalNodes)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Perkiraan jam belajar</dt>
                  <dd className="font-display text-2xl font-semibold">{formatNumber(totalHours)}</dd>
                </div>
              </dl>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/login">
                  Mulai Gratis
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          {roadmaps.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
              Daftar roadmap sedang tidak tersedia. Coba muat ulang halaman ini beberapa saat lagi.
            </p>
          ) : (
            <div className="space-y-14">
              {groups.map((group) => (
                <section key={group.domain} aria-labelledby={`domain-${group.domain}`}>
                  <header className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
                    <h2
                      id={`domain-${group.domain}`}
                      className="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
                    >
                      {group.label}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(group.items.length)} roadmap
                    </span>
                  </header>

                  <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((item) => (
                      <li key={item.slug}>
                        <RoadmapCardTile item={item} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Closing CTA — the roadmaps are readable without an account; the
            progress tracking is the thing an account adds. */}
        <section className="border-t border-border bg-card/40">
          <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Ingin melacak progres belajar Anda?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Simpan roadmap ke akun CareerPack untuk menandai materi yang sudah selesai, mencatat
              sumber belajar, dan menyambungkannya ke CV Anda.
            </p>
            <div className="mt-6 flex justify-center">
              <Button asChild size="lg">
                <Link href="/login">
                  Mulai Gratis
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

function RoadmapCardTile({ item }: { item: RoadmapCard }) {
  const Icon = ICONS[item.icon] ?? BookOpen;
  return (
    <Link
      href={`/roadmap/${item.slug}`}
      className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span
        aria-hidden
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm",
          accentClass(item.color),
        )}
      >
        <Icon className="h-5 w-5" />
      </span>

      <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-foreground group-hover:text-brand">
        {item.title}
      </h3>

      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {item.description}
      </p>

      <div className="mt-auto space-y-3 pt-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" aria-hidden />
            {formatNumber(item.nodeCount)} materi
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            ±{formatNumber(item.totalHours)} jam
          </span>
        </div>

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.slice(0, 4).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="rounded-full border border-brand/20 bg-brand-muted px-2.5 py-0.5 text-[11px] font-medium text-brand-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
            {item.tags.length > 4 && (
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px]">
                +{item.tags.length - 4}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
