import { ConvexHttpClient } from "convex/browser";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, Linkedin, Mail, Sparkles, Star } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { BrandMark } from "@/shared/components/brand/Logo";
import { ParangPattern } from "@/shared/components/decor/ParangPattern";
import { Reveal } from "@/shared/components/motion/Reveal";
import { cn } from "@/shared/lib/utils";
import { PersonalBrandingPage, type BrandingPayload } from "@/slices/personal-branding/themes";
import type {
  Block as PBBlock,
  HeaderBg as PBHeaderBg,
  PersonalBrandingTheme as PBTheme,
} from "@/slices/personal-branding/blocks/types";

const CATEGORY_LABELS: Record<string, string> = {
  project: "Proyek",
  certification: "Sertifikasi",
  publication: "Publikasi",
};

/**
 * Public personal-brand page — rendered at https://careerpack.org/<slug>.
 *
 * Security checkpoints (mirrors convex/publicProfile.ts §):
 * 1. Server Component only — no client bundle leaks field whitelist.
 * 2. `getBySlug` returns null for every kind of failure → we notFound()
 *    so attackers can't distinguish "slug exists but disabled" from
 *    "slug never existed".
 * 3. `<meta name="robots">` defaults to noindex, noarchive, nosnippet —
 *    only unlocked when the user explicitly sets `publicAllowIndex`.
 * 4. No raw HTML rendered. React auto-escapes text, no `dangerouslySet*`.
 * 5. ISR with revalidate=60s — absorbs enumeration scraping behind the
 *    CDN before it reaches Convex.
 * 6. Static routes (/login, /admin, /dashboard, etc.) take priority over
 *    this dynamic segment per Next.js router rules; reserved-slug list
 *    in publicProfile.ts prevents users from claiming those paths even
 *    if routing changed.
 */

export const revalidate = 60;
export const dynamic = "force-static";
export const dynamicParams = true;

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

interface PageProps {
  params: Promise<{ slug: string }>;
}

type PublicProfile = NonNullable<
  Awaited<ReturnType<typeof fetchPublicProfile>>
>;

export interface PublicPortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  link: string;
  date: string;
  techStack: string[];
  featured: boolean;
  coverEmoji: string | null;
  coverGradient: string | null;
  coverUrl: string | null;
}

async function fetchPublicProfile(slug: string): Promise<{
  slug: string;
  displayName: string;
  headline: string;
  targetRole: string;
  bio: string;
  skills: string[];
  contactEmail: string;
  linkedinUrl: string;
  portfolioUrl: string;
  allowIndex: boolean;
  avatarUrl: string | null;
  portfolio: PublicPortfolioItem[];
  theme: string;
  mode?: string;
  headerBg: { kind: string; value: string } | null;
  accent: string | null;
  blocks: ReadonlyArray<{ id: string; type: string; payload: unknown }>;
  branding?: BrandingPayload;
  updatedAt: number;
} | null> {
  if (!CONVEX_URL) return null;
  const client = new ConvexHttpClient(CONVEX_URL);
  try {
    const result = await client.query(api.profile.queries.getBySlug, { slug });
    return result;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await fetchPublicProfile(slug);
  if (!profile) {
    return {
      title: "Profil tidak ditemukan",
      robots: { index: false, follow: false },
    };
  }

  const description =
    profile.headline ||
    (profile.targetRole ? `${profile.targetRole} — CareerPack` : "Personal brand CareerPack");

  return {
    title: `${profile.displayName} · CareerPack`,
    description,
    openGraph: {
      title: profile.displayName,
      description,
      type: "profile",
      url: `https://careerpack.org/${profile.slug}`,
    },
    twitter: {
      card: "summary",
      title: profile.displayName,
      description,
    },
    robots: profile.allowIndex
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await fetchPublicProfile(slug);
  if (!profile) notFound();
  // When the user has authored blocks via the Personal Branding builder,
  // render through the theme dispatcher so visitors see their custom
  // page. Otherwise fall back to the legacy auto-rendered ProfileView
  // (avatar + bio + skills + portfolio grid). This keeps existing
  // public profiles working while letting new ones go custom.
  const hasCustomBlocks =
    Array.isArray(profile.blocks) && profile.blocks.length > 0;
  if (hasCustomBlocks) {
    return (
      <PersonalBrandingPage
        profile={{
          slug: profile.slug,
          displayName: profile.displayName,
          headline: profile.headline,
          targetRole: profile.targetRole,
          avatarUrl: profile.avatarUrl,
          blocks: profile.blocks as PBBlock[],
          theme: (profile.theme ?? "linktree") as PBTheme,
          headerBg: (profile.headerBg ?? null) as PBHeaderBg | null,
          accent: profile.accent ?? null,
          branding: profile.branding,
        }}
      />
    );
  }
  return <ProfileView profile={profile} />;
}

function ProfileView({ profile }: { profile: PublicProfile }) {
  const hasContact =
    profile.contactEmail || profile.linkedinUrl || profile.portfolioUrl;
  const hasPortfolio = profile.portfolio.length > 0;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2" aria-label="CareerPack">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground">
              <BrandMark size={18} stroke="hsl(var(--brand-foreground))" strokeWidth={2.4} />
            </span>
            <span className="text-sm font-semibold">CareerPack</span>
          </Link>
          <Link
            href="/"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Bikin profil juga
          </Link>
        </div>
      </header>

      {/* Hero — full-bleed with parang texture + soft brand wash. */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-brand-muted/40 via-background to-background">
        <ParangPattern className="text-brand/20" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <Reveal id={`hero-${profile.slug}`} delay={0}>
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
              {profile.avatarUrl && (
                <div className="relative flex-shrink-0">
                  <span
                    aria-hidden
                    className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-brand-from to-brand-to opacity-80 blur-[2px]"
                  />
                  <Image
                    src={profile.avatarUrl}
                    alt={`Foto profil ${profile.displayName}`}
                    width={128}
                    height={128}
                    unoptimized
                    className="relative h-28 w-28 rounded-full object-cover ring-4 ring-background sm:h-32 sm:w-32"
                  />
                </div>
              )}
              <div className="min-w-0 space-y-3">
                <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  {profile.displayName}
                </h1>
                {profile.targetRole && (
                  <p className="text-lg font-medium text-brand sm:text-xl">
                    {profile.targetRole}
                  </p>
                )}
                {profile.headline && (
                  <p className="max-w-2xl text-base leading-relaxed text-foreground/80 sm:text-lg">
                    {profile.headline}
                  </p>
                )}
              </div>
            </div>
          </Reveal>

          {hasContact && (
            <Reveal id={`hero-cta-${profile.slug}`} delay={120}>
              <div className="mt-8 flex flex-wrap gap-2">
                {profile.contactEmail && (
                  <Button asChild variant="default" size="sm">
                    <a href={`mailto:${profile.contactEmail}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Email
                    </a>
                  </Button>
                )}
                {profile.linkedinUrl && (
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="mr-2 h-4 w-4" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                {profile.portfolioUrl && (
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={profile.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Portfolio
                    </a>
                  </Button>
                )}
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <article className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {profile.bio && (
          <Reveal id={`bio-${profile.slug}`} delay={0}>
            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Sparkles className="h-4 w-4 text-brand" />
                Tentang
              </h2>
              <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
                {profile.bio}
              </p>
            </section>
          </Reveal>
        )}

        {profile.skills.length > 0 && (
          <Reveal id={`skills-${profile.slug}`} delay={80}>
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Keterampilan
              </h2>
              <ul className="flex flex-wrap gap-2">
                {profile.skills.map((skill, idx) => (
                  <li
                    key={skill}
                    className="motion-safe:animate-reveal-up"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <Badge
                      variant="secondary"
                      className="rounded-full border border-brand/20 bg-brand-muted px-3 py-1 text-sm text-brand-muted-foreground"
                    >
                      {skill}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        )}

        {hasPortfolio && (
          <Reveal id={`portfolio-${profile.slug}`} delay={120}>
            <section>
              <header className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Portofolio
                  </h2>
                  <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    Yang pernah dikerjakan
                  </p>
                </div>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {profile.portfolio.length} item
                </span>
              </header>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-6">
                {profile.portfolio.map((item, idx) => (
                  <PortfolioTile key={item.id} item={item} index={idx} />
                ))}
              </div>
            </section>
          </Reveal>
        )}
      </article>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} CareerPack · {profile.displayName}</span>
          <span>
            Ingin profil seperti ini?{" "}
            <Link href="/" className="font-medium text-brand underline-offset-4 hover:underline">
              Gabung gratis
            </Link>
          </span>
        </div>
      </footer>
    </main>
  );
}

/**
 * Bento tile for a portfolio item. Featured items span 2 columns on md+
 * to create the signature asymmetric grid. Cover priority:
 * uploaded image → emoji on gradient fallback.
 */
function PortfolioTile({
  item,
  index,
}: {
  item: PublicPortfolioItem;
  index: number;
}) {
  const span = item.featured ? "md:col-span-4" : "md:col-span-2";
  const height = item.featured ? "h-56 sm:h-64" : "h-44";
  const categoryLabel = CATEGORY_LABELS[item.category] ?? item.category;
  const formattedDate = (() => {
    try {
      return new Date(item.date).toLocaleDateString("id-ID", {
        month: "short",
        year: "numeric",
      });
    } catch {
      return item.date;
    }
  })();

  const Inner = (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all",
        "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          !item.coverUrl && "flex items-center justify-center bg-gradient-to-br",
          !item.coverUrl && (item.coverGradient ?? "from-slate-500 to-slate-700"),
          height,
        )}
      >
        {item.coverUrl ? (
          <Image
            src={item.coverUrl}
            alt={item.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span
            className={cn(
              "text-6xl drop-shadow-sm",
              item.featured && "text-7xl sm:text-8xl",
            )}
            aria-hidden="true"
          >
            {item.coverEmoji ?? "📄"}
          </span>
        )}
        {item.featured && (
          <Badge className="absolute left-3 top-3 gap-1 bg-background/90 text-foreground shadow-sm backdrop-blur-sm">
            <Star className="h-3 w-3 fill-warning text-warning" />
            Unggulan
          </Badge>
        )}
        <Badge
          variant="secondary"
          className="absolute right-3 top-3 bg-background/80 text-foreground shadow-sm backdrop-blur-sm"
        >
          {categoryLabel}
        </Badge>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3
            className={cn(
              "font-display font-semibold leading-snug text-foreground",
              item.featured ? "text-xl sm:text-2xl" : "text-lg",
            )}
          >
            {item.title}
          </h3>
          {item.link && (
            <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-brand" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
        <p
          className={cn(
            "text-sm leading-relaxed text-foreground/80",
            item.featured ? "line-clamp-3" : "line-clamp-2",
          )}
        >
          {item.description}
        </p>
        {item.techStack.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-2">
            {item.techStack.slice(0, item.featured ? 6 : 3).map((tech) => (
              <Badge
                key={tech}
                variant="secondary"
                className="bg-brand-muted/60 text-[10px] text-brand-muted-foreground"
              >
                {tech}
              </Badge>
            ))}
            {item.techStack.length > (item.featured ? 6 : 3) && (
              <Badge variant="secondary" className="text-[10px]">
                +{item.techStack.length - (item.featured ? 6 : 3)}
              </Badge>
            )}
          </div>
        )}
      </div>
    </article>
  );

  const wrapperClass = cn(
    span,
    "motion-safe:animate-reveal-up",
  );

  if (item.link) {
    return (
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(wrapperClass, "block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl")}
        style={{ animationDelay: `${index * 60}ms` }}
        aria-label={`${item.title} — buka tautan`}
      >
        {Inner}
      </a>
    );
  }

  return (
    <div
      className={wrapperClass}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {Inner}
    </div>
  );
}
