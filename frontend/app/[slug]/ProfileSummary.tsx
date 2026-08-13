import Link from "next/link";
import { Mail, Linkedin, ExternalLink } from "lucide-react";

/**
 * The text version of a public profile, rendered below the template.
 *
 * Why it exists: everything a visitor sees on this route lives in a `srcDoc`
 * iframe, sandboxed without `allow-same-origin` — a deliberate trust boundary
 * (80 KB of standalone HTML/CSS/JS with its own <head>), and one worth keeping.
 * But an opaque origin has no URL, so nothing in there is indexable, and the
 * document itself was shipping zero `<h1>` and 64 characters of text while
 * `sitemap.ts` listed it and `page.tsx` attached Person JSON-LD to it.
 *
 * An earlier attempt server-rendered the profile only until the template
 * loaded. That fixed crawlers which do not execute JavaScript — which is most
 * of them, including every AI answer engine — but not Googlebot, which renders
 * and indexes the resulting DOM, by which point the template had replaced it.
 * The alternative was keeping that markup mounted and hidden, which is the
 * exact shape of a hidden-text violation regardless of intent.
 *
 * So this is permanent and visible. It carries the page's only `<h1>`: the
 * template's own heading lives in a separate document and cannot serve as this
 * one's. It is also the reason the route degrades well — if the template fetch
 * fails, the visitor still gets the name, bio, work and contact details rather
 * than an error card where somebody's profile should be.
 */

const CATEGORY_LABELS: Record<string, string> = {
  project: "Proyek",
  certification: "Sertifikasi",
  publication: "Publikasi",
};

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  link: string;
  date: string;
  techStack: string[];
}

interface SummaryProfile {
  slug: string;
  displayName: string;
  headline?: string | null;
  targetRole?: string | null;
  bio?: string | null;
  skills: string[];
  portfolio: PortfolioItem[];
  contactEmail?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
}

/** Anything not plain http(s) renders as text, never as an anchor. */
function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

export function ProfileSummary({ profile }: { profile: SummaryProfile }) {
  const subtitle = profile.headline || profile.targetRole || null;
  const hasContact = Boolean(
    profile.contactEmail || profile.linkedinUrl || profile.portfolioUrl,
  );

  return (
    <section
      aria-labelledby="ringkasan-profil"
      className="border-t border-border bg-background"
    >
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Ringkasan profil
        </p>

        <h1
          id="ringkasan-profil"
          className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          {profile.displayName}
        </h1>

        {subtitle && (
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}

        {profile.bio && (
          <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground/90">
            {profile.bio}
          </p>
        )}

        {profile.skills.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Keahlian
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground/90"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        )}

        {profile.portfolio.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Karya &amp; pencapaian
            </h2>
            <ul className="mt-4 space-y-6">
              {profile.portfolio.map((item) => {
                const linkable = item.link && isSafeUrl(item.link);
                return (
                  <li key={item.id}>
                    <h3 className="font-medium text-foreground">
                      {linkable ? (
                        <a
                          href={item.link}
                          target="_blank"
                          // nofollow: these are visitor-supplied URLs on a page
                          // anyone can publish, so they must not pass ranking
                          // signal from this domain.
                          rel="nofollow noopener noreferrer"
                          className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
                        >
                          {item.title}
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      ) : (
                        item.title
                      )}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[CATEGORY_LABELS[item.category] ?? item.category, item.date]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {item.description && (
                      <p className="mt-2 leading-relaxed text-foreground/90">
                        {item.description}
                      </p>
                    )}
                    {item.techStack.length > 0 && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {item.techStack.join(" · ")}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {hasContact && (
          <div className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Kontak
            </h2>
            <ul className="mt-3 space-y-2">
              {profile.contactEmail && (
                <li>
                  <a
                    href={`mailto:${profile.contactEmail}`}
                    className="inline-flex items-center gap-2 py-1 underline-offset-4 hover:underline"
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    {profile.contactEmail}
                  </a>
                </li>
              )}
              {profile.linkedinUrl && isSafeUrl(profile.linkedinUrl) && (
                <li>
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="inline-flex items-center gap-2 py-1 underline-offset-4 hover:underline"
                  >
                    <Linkedin className="h-4 w-4" aria-hidden="true" />
                    LinkedIn
                  </a>
                </li>
              )}
              {profile.portfolioUrl && isSafeUrl(profile.portfolioUrl) && (
                <li>
                  <a
                    href={profile.portfolioUrl}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="inline-flex items-center gap-2 py-1 underline-offset-4 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Situs pribadi
                  </a>
                </li>
              )}
            </ul>
          </div>
        )}

        <p className="mt-10 text-sm text-muted-foreground">
          Halaman ini dibuat dengan{" "}
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">
            CareerPack
          </Link>
          . Buat halaman profilmu sendiri, gratis.
        </p>
      </div>
    </section>
  );
}
