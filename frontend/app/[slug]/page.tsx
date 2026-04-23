import { ConvexHttpClient } from "convex/browser";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, Linkedin, Mail, Sparkles } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { BrandMark } from "@/shared/components/brand/Logo";

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
  updatedAt: number;
} | null> {
  if (!CONVEX_URL) return null;
  const client = new ConvexHttpClient(CONVEX_URL);
  try {
    const result = await client.query(api.publicProfile.getBySlug, { slug });
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
  return <ProfileView profile={profile} />;
}

function ProfileView({ profile }: { profile: PublicProfile }) {
  const hasContact =
    profile.contactEmail || profile.linkedinUrl || profile.portfolioUrl;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
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

      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {profile.displayName}
              </h1>
              {profile.targetRole && (
                <p className="text-lg text-muted-foreground">{profile.targetRole}</p>
              )}
              {profile.headline && (
                <p className="max-w-2xl text-base text-foreground/80">
                  {profile.headline}
                </p>
              )}
            </div>
            {hasContact && (
              <div className="flex flex-wrap gap-2">
                {profile.contactEmail && (
                  <Button asChild variant="outline" size="sm">
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
            )}
          </div>

          {profile.bio && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <Sparkles className="h-4 w-4 text-brand" />
                Tentang
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {profile.bio}
              </p>
            </div>
          )}

          {profile.skills.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Keterampilan
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="bg-brand-muted text-brand-muted-foreground">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </section>
      </article>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-6 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} CareerPack</span>
          <span>
            Ingin profil seperti ini?{" "}
            <Link href="/" className="underline-offset-4 hover:underline">
              Gabung gratis
            </Link>
          </span>
        </div>
      </footer>
    </main>
  );
}
