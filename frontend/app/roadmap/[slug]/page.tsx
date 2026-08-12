import type { Metadata } from "next";
import type { ElementType } from "react";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BedDouble,
  BookOpen,
  Clock,
  ExternalLink,
  FileText,
  Layers,
  Sparkles,
  Target,
  Video,
} from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { JsonLd } from "@/shared/components/seo/JsonLd";
import { publicContentQuery, publicContentList } from "@/shared/lib/publicContentQuery";
import { MarketingHeader } from "@/shared/components/layout/MarketingHeader";
import { MarketingFooter } from "@/shared/components/layout/MarketingFooter";
import { ParangPattern } from "@/shared/components/decor/ParangPattern";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { DOMAIN_LABELS, iconMap } from "@/slices/skill-roadmap/constants/builder";
import { getDifficultyLabel } from "@/slices/skill-roadmap/lib/treeBuilder";

/**
 * /roadmap/[slug] — one public roadmap, rendered entirely from the
 * `roadmapTemplates` row. Nothing here is authored: node titles,
 * descriptions, hour estimates and resource links all come from the data.
 * Only the surrounding framing (headings, CTA) is ours.
 *
 * Visibility is the backend's job — `getPublicRoadmap` returns null for both
 * "no such slug" and "not isPublic", and both cases land on notFound(), so a
 * community template that was never published (or was unpublished by an
 * admin) is indistinguishable from one that never existed.
 */
export const revalidate = 3600;
export const dynamicParams = true;

const SITE_URL = "https://careerpack.org";

type RoadmapTemplate = Doc<"roadmapTemplates">;
type RoadmapNode = RoadmapTemplate["nodes"][number];
type RoadmapResource = RoadmapNode["resources"][number];

/** See the same block in ../page.tsx — Tailwind cannot see database strings. */
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
  const family = color.split("-")[1] ?? "";
  return ACCENT_CLASS[family] ?? "bg-brand";
}

const ICONS: Record<string, ElementType> = { ...iconMap, BedDouble, Sparkles };

const DIFFICULTY_TONE: Record<string, string> = {
  beginner: "border-success/30 bg-success/10 text-success-text",
  intermediate: "border-warning/30 bg-warning/10 text-warning-text",
  advanced: "border-destructive/30 bg-destructive/10 text-destructive-text",
};

const RESOURCE_META: Record<string, { label: string; Icon: ElementType }> = {
  course: { label: "Kursus", Icon: BookOpen },
  video: { label: "Video", Icon: Video },
  article: { label: "Artikel", Icon: FileText },
  documentation: { label: "Dokumentasi", Icon: FileText },
  book: { label: "Buku", Icon: BookOpen },
  practice: { label: "Latihan", Icon: Target },
};

/**
 * Community templates are user-authored (`publishMyRoadmap`) and resource URLs
 * are never validated on write, so a row could carry `javascript:` or `data:`.
 * Anything that is not plain http(s) is rendered as inert text instead of an
 * anchor. Belt and braces on top of React's own escaping.
 */
function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

function formatNumber(n: number): string {
  return n.toLocaleString("id-ID");
}

/**
 * `cache` dedupes the fetch between `generateMetadata` and the page body —
 * both run per render and would otherwise hit Convex twice for the same slug.
 */
const fetchRoadmap = cache(async (slug: string): Promise<RoadmapTemplate | null> => {
  const row = await publicContentQuery(
    (client) => client.query(api.roadmap.queries.getPublicRoadmap, { slug }),
    null,
  );
  return (row as RoadmapTemplate | null) ?? null;
});

/**
 * Prerender every public roadmap at build time. An unreachable Convex must
 * never fail the build (Dokploy builds straight off a push), so on any error
 * we ship zero prerendered slugs and let `dynamicParams` render them on
 * demand instead.
 */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const rows = await publicContentList<{ slug: string }>((client) =>
    client.query(api.roadmap.queries.listPublicRoadmaps, {}),
  );
  return rows.map((r) => ({ slug: r.slug }));
}

function totalHoursOf(nodes: readonly RoadmapNode[]): number {
  return nodes.reduce((sum, n) => sum + n.estimatedHours, 0);
}

/** Trim to a length search engines actually render, on a word boundary. */
function metaDescription(tpl: RoadmapTemplate): string {
  const base =
    tpl.description.trim() ||
    `Roadmap belajar ${tpl.title}: ${formatNumber(tpl.nodes.length)} materi dengan perkiraan ${formatNumber(totalHoursOf(tpl.nodes))} jam belajar.`;
  if (base.length <= 160) return base;
  const cut = base.slice(0, 157);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 100 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tpl = await fetchRoadmap(slug);
  if (!tpl) notFound();

  const description = metaDescription(tpl);
  const url = `${SITE_URL}/roadmap/${tpl.slug}`;

  return {
    // Root layout's title.template appends " · CareerPack".
    title: `Roadmap ${tpl.title}`,
    description,
    keywords: tpl.tags.length > 0 ? tpl.tags : undefined,
    alternates: { canonical: `/roadmap/${tpl.slug}` },
    openGraph: {
      // Restated in full: Next replaces the parent `openGraph` wholesale.
      type: "article",
      locale: "id_ID",
      siteName: "CareerPack",
      url,
      title: `Roadmap ${tpl.title} · CareerPack`,
      description,
      images: [{ url: "/og/og-card.jpg", width: 1200, height: 630, alt: "CareerPack" }],
    },
  };
}

/**
 * Group nodes by `category`, preserving first-appearance order (the array
 * order is the curated learning order — do not sort it). Nodes without a
 * category are labelled "Materi lainnya" rather than dropped.
 *
 * Groups are CONSECUTIVE RUNS, not buckets. Bucketing by category pulled every
 * node with the same label together, which silently resequenced any roadmap
 * whose categories interleave — 18 of the 47 published rows. On
 * /roadmap/product-manager the stored order is pm-1..pm-8 with categories
 * Fondasi, Riset, Strategi, Proses, Eksekusi, Analitik, Eksekusi, Strategi;
 * bucketing hoisted pm-8 up beside pm-3 and presented the result as the
 * intended path, contradicting the roadmap's own `prerequisites`. A category
 * that legitimately recurs later now simply appears twice, which is what the
 * stored data actually says.
 */
function groupByCategory(nodes: readonly RoadmapNode[]): Array<{ label: string; nodes: RoadmapNode[] }> {
  const UNCATEGORISED = "Materi lainnya";
  const groups: Array<{ label: string; nodes: RoadmapNode[] }> = [];
  for (const node of nodes) {
    const label = node.category?.trim() || UNCATEGORISED;
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.nodes.push(node);
    else groups.push({ label, nodes: [node] });
  }
  return groups;
}

export default async function RoadmapDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const tpl = await fetchRoadmap(slug);
  if (!tpl) notFound();

  const Icon = ICONS[tpl.icon] ?? BookOpen;
  const domainLabel = DOMAIN_LABELS[tpl.domain] ?? tpl.domain;
  const totalHours = totalHoursOf(tpl.nodes);
  const groups = groupByCategory(tpl.nodes);
  // Distinct labels, not `groups.length` — a category that recurs later in
  // the stored order produces two runs but is still one category.
  const categoryCount = new Set(groups.map((g) => g.label)).size;
  const url = `${SITE_URL}/roadmap/${tpl.slug}`;

  // Node id → title, so prerequisites render as names instead of raw ids.
  const titleById = new Map(tpl.nodes.map((n) => [n.id, n.title]));

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Roadmap", item: `${SITE_URL}/roadmap` },
      { "@type": "ListItem", position: 3, name: tpl.title, item: url },
    ],
  };

  const courseLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: tpl.title,
    description: tpl.description || metaDescription(tpl),
    url,
    inLanguage: "id-ID",
    isAccessibleForFree: true,
    provider: { "@type": "Organization", name: "CareerPack", url: SITE_URL },
    hasPart: tpl.nodes.map((node, i) => {
      const part: Record<string, unknown> = {
        "@type": "Syllabus",
        position: i + 1,
        name: node.title,
        description: node.description,
      };
      if (node.estimatedHours > 0) part.timeRequired = `PT${node.estimatedHours}H`;
      if (node.category) part.about = node.category;
      return part;
    }),
  };
  if (tpl.tags.length > 0) courseLd.teaches = tpl.tags;
  if (totalHours > 0) courseLd.timeRequired = `PT${totalHours}H`;
  if (tpl.authorName) courseLd.author = { "@type": "Person", name: tpl.authorName };

  // Display numbering runs across the whole roadmap, not per group, so
  // "materi 14" means the same thing in the page and in a shared link.
  // Precomputed rather than counted during render — a mutable counter inside
  // JSX is a re-render hazard for no gain.
  const numberByNodeId = new Map<string, number>();
  for (const group of groups) {
    for (const node of group.nodes) numberByNodeId.set(node.id, numberByNodeId.size + 1);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <JsonLd data={courseLd} />
      <JsonLd data={breadcrumbLd} />
      <MarketingHeader />

      <main className="flex-1">
        <section className="relative isolate overflow-hidden border-b border-border/60 bg-gradient-to-b from-brand-muted/40 via-background to-background">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <ParangPattern className="text-brand/20" />
          </div>
          <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <nav aria-label="Jejak navigasi" className="mb-6">
              <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <li>
                  <Link href="/" className="inline-block py-1.5 underline-offset-4 hover:text-foreground hover:underline">
                    Beranda
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link href="/roadmap" className="inline-block py-1.5 underline-offset-4 hover:text-foreground hover:underline">
                    Roadmap
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li className="font-medium text-foreground" aria-current="page">
                  {tpl.title}
                </li>
              </ol>
            </nav>

            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm",
                  accentClass(tpl.color),
                )}
              >
                <Icon className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {domainLabel}
                </p>
                <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  {tpl.title}
                </h1>
              </div>
            </div>

            {tpl.description && (
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {tpl.description}
              </p>
            )}

            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Materi</dt>
                <dd className="font-display text-2xl font-semibold">{formatNumber(tpl.nodes.length)}</dd>
              </div>
              {totalHours > 0 && (
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Perkiraan jam belajar
                  </dt>
                  <dd className="font-display text-2xl font-semibold">±{formatNumber(totalHours)}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Kategori</dt>
                <dd className="font-display text-2xl font-semibold">{formatNumber(categoryCount)}</dd>
              </div>
            </dl>

            {tpl.tags.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-1.5">
                {tpl.tags.map((tag) => (
                  <li key={tag}>
                    <Badge
                      variant="secondary"
                      className="rounded-full border border-brand/20 bg-brand-muted px-3 py-1 text-xs font-medium text-brand-muted-foreground"
                    >
                      {tag}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}

            {tpl.authorName && (
              <p className="mt-6 text-sm text-muted-foreground">
                Disusun oleh {tpl.authorName}
              </p>
            )}
          </div>
        </section>

        <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          {tpl.nodes.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
              Roadmap ini belum memiliki materi.
            </p>
          ) : (
            <div className="space-y-12">
              {groups.map((group, groupIndex) => {
                const groupHours = totalHoursOf(group.nodes);
                const groupId = `bagian-${groupIndex + 1}`;
                return (
                  <section key={groupId} aria-labelledby={groupId}>
                    <header className="mb-6 border-b border-border pb-3">
                      <h2
                        id={groupId}
                        className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl"
                      >
                        {group.label}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatNumber(group.nodes.length)} materi
                        {groupHours > 0 && <> · ±{formatNumber(groupHours)} jam</>}
                      </p>
                    </header>

                    <ol className="space-y-5">
                      {group.nodes.map((node) => (
                        <li key={node.id}>
                          <NodeCard
                            node={node}
                            index={numberByNodeId.get(node.id) ?? 0}
                            titleById={titleById}
                          />
                        </li>
                      ))}
                    </ol>
                  </section>
                );
              })}
            </div>
          )}

          <aside className="mt-14 rounded-2xl border border-border bg-card/60 p-6 text-center sm:p-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Simpan roadmap ini ke akun Anda
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Tandai materi yang sudah selesai, catat sumber belajar yang Anda pakai, dan sambungkan
              hasilnya ke CV Anda. Gratis, tanpa kartu kredit.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/login">
                  Mulai Gratis
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/roadmap">Lihat roadmap lainnya</Link>
              </Button>
            </div>
          </aside>
        </article>
      </main>

      <MarketingFooter />
    </div>
  );
}

function NodeCard({
  node,
  index,
  titleById,
}: {
  node: RoadmapNode;
  index: number;
  titleById: Map<string, string>;
}) {
  // Prerequisites are stored as node ids. Resolve to titles and drop any id
  // that no longer exists rather than printing a raw key at the reader.
  const prerequisites = node.prerequisites
    .map((id) => titleById.get(id))
    .filter((title): title is string => Boolean(title));

  const tone = DIFFICULTY_TONE[node.difficulty] ?? "border-border bg-muted text-muted-foreground";

  return (
    <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold leading-snug tracking-tight sm:text-xl">
          <span className="mr-2 text-muted-foreground">{index}.</span>
          {node.title}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-xs", tone)}>
            {getDifficultyLabel(node.difficulty)}
          </Badge>
          {node.estimatedHours > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden />±{formatNumber(node.estimatedHours)} jam
            </span>
          )}
        </div>
      </div>

      {node.description && (
        <p className="mt-3 text-sm leading-relaxed text-foreground/85">{node.description}</p>
      )}

      {prerequisites.length > 0 && (
        <p className="mt-3 flex flex-wrap items-baseline gap-x-1.5 text-sm text-muted-foreground">
          <Layers className="h-3.5 w-3.5 translate-y-0.5" aria-hidden />
          <span className="font-medium text-foreground/80">Prasyarat:</span>
          {prerequisites.join(", ")}
        </p>
      )}

      {node.resources.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Sumber belajar
          </h4>
          <ul className="mt-2 space-y-1.5">
            {node.resources.map((resource) => (
              <li key={resource.id}>
                <ResourceRow resource={resource} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function ResourceRow({ resource }: { resource: RoadmapResource }) {
  const meta = RESOURCE_META[resource.type] ?? { label: resource.type, Icon: ExternalLink };
  const { Icon } = meta;

  const label = (
    <>
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1 break-words">{resource.title}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{meta.label}</span>
      <Badge
        variant="outline"
        className={cn(
          "shrink-0 rounded-full px-2 py-0 text-xs font-medium",
          resource.free
            ? "border-success/30 bg-success/10 text-success-text"
            : "border-border text-muted-foreground",
        )}
      >
        {resource.free ? "Gratis" : "Berbayar"}
      </Badge>
    </>
  );

  if (!isSafeUrl(resource.url)) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm">
        {label}
      </div>
    );
  }

  return (
    <a
      href={resource.url}
      target="_blank"
      // nofollow: these are third-party links published by users, so the site
      // must not pass ranking signal to whatever they point at.
      rel="nofollow noopener noreferrer"
      className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm transition-colors hover:border-brand/40 hover:bg-brand-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {label}
    </a>
  );
}
