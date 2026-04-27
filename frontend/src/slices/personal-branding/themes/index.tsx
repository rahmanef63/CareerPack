"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { BrandMark } from "@/shared/components/brand/Logo";
import {
  TEMPLATE_URLS,
  TEMPLATE_THEMES,
  type Block,
  type HeaderBg,
  type PersonalBrandingTheme,
  type TemplateTheme,
} from "../blocks/types";
import { TEMPLATE_HYDRATOR_JS } from "./templateHydrator";

/** Branding payload mirrors `convex/profile/brandingPayload.ts`. The
 *  iframe templates read it from `window.__careerpack` and use
 *  `data-cp` markers + `has` flags to populate / hide sections. */
export interface BrandingPayload {
  identity: {
    name: string;
    headline: string;
    targetRole: string;
    location: string;
    avatarUrl: string | null;
    contact: { email: string; linkedin: string; portfolio: string };
  };
  about: { bio: string; summary: string };
  skills: string[];
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa: string;
  }>;
  certifications: Array<{ name: string; issuer: string; date: string }>;
  languages: Array<{ language: string; proficiency: string }>;
  projects: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    link: string;
    date: string;
    techStack: string[];
    featured: boolean;
    coverEmoji: string | null;
    coverUrl: string | null;
  }>;
  has: {
    about: boolean;
    skills: boolean;
    experience: boolean;
    education: boolean;
    certifications: boolean;
    languages: boolean;
    projects: boolean;
    contact: boolean;
  };
}

interface ProfileShape {
  slug: string;
  displayName: string;
  headline: string;
  targetRole?: string;
  avatarUrl: string | null;
  blocks: Block[];
  theme: PersonalBrandingTheme;
  headerBg: HeaderBg | null;
  accent: string | null;
  /** Optional — when present, fed into the iframe so templates render
   *  with real data and hide empty sections. */
  branding?: BrandingPayload;
}

/**
 * Public-page renderer dispatcher. Only template-v1/v2/v3 are
 * supported. Legacy themes (linktree/bento/magazine) from existing
 * profiles fall back to template-v2 at render time — schema validator
 * still accepts them for backward read-compatibility.
 */
export function PersonalBrandingPage({
  profile,
  brand = true,
}: {
  profile: ProfileShape;
  brand?: boolean;
}) {
  const accentVar = profile.accent
    ? ({ "--branding-accent": profile.accent } as React.CSSProperties)
    : undefined;
  const theme = normalizeTheme(profile.theme);
  return (
    <div className="min-h-screen bg-background text-foreground" style={accentVar}>
      <TemplateLayout
        theme={theme}
        displayName={profile.displayName}
        branding={profile.branding}
      />
      {brand && <BrandFooter slug={profile.slug} displayName={profile.displayName} />}
    </div>
  );
}

function normalizeTheme(t: PersonalBrandingTheme): TemplateTheme {
  return (TEMPLATE_THEMES as readonly string[]).includes(t)
    ? (t as TemplateTheme)
    : "template-v2";
}

// ---------------------------------------------------------------------
// Static HTML Template — iframe + skeleton fallback
// ---------------------------------------------------------------------

/** In-memory cache shared across re-mounts so switching themes doesn't
 *  re-fetch templates already seen this session. */
const TEMPLATE_HTML_CACHE = new Map<TemplateTheme, string>();

function TemplateLayout({
  theme,
  displayName,
  branding,
}: {
  theme: TemplateTheme;
  displayName: string;
  branding?: BrandingPayload;
}) {
  const url = TEMPLATE_URLS[theme];
  const [html, setHtml] = useState<string | null>(
    () => TEMPLATE_HTML_CACHE.get(theme) ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cached = TEMPLATE_HTML_CACHE.get(theme);
    if (cached) {
      setHtml(cached);
      setError(null);
      return;
    }
    setHtml(null);
    setError(null);
    fetch(url, { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (cancelled) return;
        TEMPLATE_HTML_CACHE.set(theme, text);
        setHtml(text);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Gagal memuat template");
      });
    return () => {
      cancelled = true;
    };
  }, [theme, url]);

  // Inject branding payload + hydrator so the iframe can replace mock
  // copy with the user's real data and hide empty sections. The
  // hydrator runs after DOMContentLoaded inside the iframe; the
  // template files themselves carry `data-cp` markers (see
  // public/personal-branding/templates/*.html).
  const hydratedHtml = useMemo(() => {
    if (!html) return html;
    return injectBrandingIntoHtml(html, branding);
  }, [html, branding]);

  return (
    <div className="relative w-full" style={{ minHeight: "calc(100vh - 64px)" }}>
      {!html && !error && <TemplateSkeleton />}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-2 rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
            <p className="font-semibold text-destructive">Template gagal dimuat</p>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground">URL: {url}</p>
          </div>
        </div>
      )}
      {hydratedHtml && (
        // srcDoc renders the HTML inline as `about:srcdoc` — no separate
        // network request to the template URL, so reverse-proxy CSP
        // headers (frame-ancestors) on that URL don't apply.
        // `key` includes the branding identity name so a profile change
        // remounts the iframe (cheaper than postMessage for now).
        <iframe
          key={`${theme}:${branding?.identity.name ?? ""}`}
          srcDoc={hydratedHtml}
          title={`Template ${theme} untuk ${displayName}`}
          loading="eager"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
          className="h-[calc(100vh-64px)] w-full border-0 bg-background"
        />
      )}
    </div>
  );
}

function TemplateSkeleton() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 z-10 flex flex-col gap-6 overflow-hidden bg-gradient-to-b from-muted/40 via-background to-background p-6 sm:p-10"
    >
      {/* header strip */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-24 rounded-full" />
        <div className="hidden gap-3 sm:flex">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-3 w-12 rounded" />
          ))}
        </div>
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>

      {/* hero block */}
      <div className="grid flex-1 gap-6 sm:grid-cols-2 sm:gap-10">
        <div className="flex flex-col gap-3 pt-6">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-5/6" />
          <Skeleton className="h-12 w-3/4" />
          <div className="mt-4 grid gap-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <div className="mt-5 flex gap-3">
            <Skeleton className="h-11 w-36 rounded-full" />
            <Skeleton className="h-11 w-32 rounded-full" />
          </div>
        </div>
        <div className="relative">
          <Skeleton className="h-full min-h-[280px] w-full rounded-[180px_180px_24px_24px] sm:rounded-[260px_260px_24px_24px]" />
          <div className="absolute right-2 top-12 hidden w-44 flex-col gap-2 rounded-2xl border border-border bg-card/70 p-4 shadow-md backdrop-blur sm:flex">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-5/6" />
            <Skeleton className="h-2 w-2/3" />
          </div>
          <div className="absolute bottom-6 left-2 hidden w-44 flex-col gap-2 rounded-2xl border border-border bg-card/70 p-4 shadow-md backdrop-blur sm:flex">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-3/4" />
          </div>
        </div>
      </div>

      {/* card row */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 rounded-xl border border-border bg-card/50 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-5/6" />
          </div>
        ))}
      </div>

      <p className="pt-2 text-center text-xs text-muted-foreground">
        Memuat template…
      </p>
    </div>
  );
}

function BrandFooter({ slug, displayName }: { slug: string; displayName: string }) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <span>
          © {new Date().getFullYear()} CareerPack ·{" "}
          <span className="font-medium text-foreground/80">{displayName}</span>
          {slug && <span className="opacity-60"> /{slug}</span>}
        </span>
        <Link
          href="/"
          className="flex items-center gap-1.5 font-medium text-brand underline-offset-4 hover:underline"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground">
            <BrandMark size={12} stroke="hsl(var(--brand-foreground))" strokeWidth={2.4} />
          </span>
          Buat halamanmu juga →
        </Link>
      </div>
    </footer>
  );
}

export type { ProfileShape };

/**
 * Splice branding payload + hydrator script into the template HTML.
 * Injects right before `</body>` so it runs after the template's own
 * markup is parsed but before `DOMContentLoaded` fires for the
 * template's own scripts (which we want — hydration must happen
 * before any of those scripts measure layout / animate sections that
 * we may end up hiding).
 *
 * If `branding` is omitted, the template renders its hardcoded mock
 * content (still useful for the picker preview thumbnails).
 */
function injectBrandingIntoHtml(html: string, branding?: BrandingPayload): string {
  if (!branding) return html;
  // Stringify safely — avoid `</script>` collisions and HTML-escape
  // unicode line/paragraph separators that JSON.stringify outputs raw.
  const json = JSON.stringify(branding)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  const dataScript = `\n<script id="__cp_data" type="application/json">${json}</script>\n`;
  const hydratorScript = `\n<script>${TEMPLATE_HYDRATOR_JS}</script>\n`;
  let result = html;

  // Data must come BEFORE the template's own inline scripts so per-
  // template mounts (e.g. v2's casesMount, skillsMount) can read it
  // when they execute. Splice into end of <head>.
  if (result.includes("</head>")) {
    result = result.replace("</head>", `${dataScript}</head>`);
  } else {
    result = `${dataScript}${result}`;
  }

  // Hydrator runs last — fills simple slots (name/headline/avatar/
  // contact/bio) and hides empty sections.
  if (result.includes("</body>")) {
    result = result.replace("</body>", `${hydratorScript}</body>`);
  } else if (result.includes("</html>")) {
    result = result.replace("</html>", `${hydratorScript}</html>`);
  } else {
    result = result + hydratorScript;
  }
  return result;
}
