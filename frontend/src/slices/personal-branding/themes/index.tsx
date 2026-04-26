"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { BrandMark } from "@/shared/components/brand/Logo";
import { ParangPattern } from "@/shared/components/decor/ParangPattern";
import { BlockRenderer } from "./BlockRenderer";
import {
  TEMPLATE_URLS,
  isTemplateTheme,
  type Block,
  type HeaderBg,
  type PersonalBrandingTheme,
  type TemplateTheme,
} from "../blocks/types";

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
}

/**
 * Public-page renderer dispatcher. Each theme picks a different layout
 * for the hero + how it tiles the block list.
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
  if (isTemplateTheme(profile.theme)) {
    return (
      <div className="min-h-screen bg-background text-foreground" style={accentVar}>
        <TemplateLayout theme={profile.theme} displayName={profile.displayName} />
        {brand && <BrandFooter slug={profile.slug} displayName={profile.displayName} />}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={accentVar}
    >
      {profile.theme === "magazine" ? (
        <MagazineLayout profile={profile} />
      ) : profile.theme === "bento" ? (
        <BentoLayout profile={profile} />
      ) : (
        <LinktreeLayout profile={profile} />
      )}
      {brand && <BrandFooter slug={profile.slug} displayName={profile.displayName} />}
    </div>
  );
}

// ---------------------------------------------------------------------
// Static HTML Template — iframe + skeleton fallback
// ---------------------------------------------------------------------

function TemplateLayout({
  theme,
  displayName,
}: {
  theme: TemplateTheme;
  displayName: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const url = TEMPLATE_URLS[theme];

  return (
    <div className="relative w-full" style={{ minHeight: "calc(100vh - 64px)" }}>
      {!loaded && <TemplateSkeleton />}
      <iframe
        key={theme}
        src={url}
        title={`Template ${theme} untuk ${displayName}`}
        loading="eager"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-[calc(100vh-64px)] w-full border-0 bg-background transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
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

// ---------------------------------------------------------------------
// Linktree — vertical centered stack
// ---------------------------------------------------------------------

function LinktreeLayout({ profile }: { profile: ProfileShape }) {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 pb-16 sm:px-6">
      <Hero
        profile={profile}
        align="center"
        className="pt-14 pb-8"
      />
      <div className="w-full space-y-3">
        {profile.blocks.map((b) => (
          <BlockRenderer key={b.id} block={b} />
        ))}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------
// Bento — asymmetric grid
// ---------------------------------------------------------------------

function BentoLayout({ profile }: { profile: ProfileShape }) {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      <Hero profile={profile} align="left" className="pt-14 pb-10" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profile.blocks.map((b) => (
          <BentoCell key={b.id} block={b} />
        ))}
      </div>
    </main>
  );
}

function BentoCell({ block }: { block: Block }) {
  // Heading + image + embed take a wider span — visual rhythm.
  const span =
    block.type === "heading" || block.type === "embed"
      ? "sm:col-span-2"
      : block.type === "image"
        ? "sm:col-span-2 lg:col-span-2"
        : "";
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        span,
      )}
    >
      <BlockRenderer block={block} />
    </div>
  );
}

// ---------------------------------------------------------------------
// Magazine — editorial reading column
// ---------------------------------------------------------------------

function MagazineLayout({ profile }: { profile: ProfileShape }) {
  return (
    <main>
      <Hero profile={profile} align="left" className="border-b border-border/60 py-16 sm:py-20" wide />
      <article className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
        {profile.blocks.map((b) => (
          <BlockRenderer key={b.id} block={b} />
        ))}
      </article>
    </main>
  );
}

// ---------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------

function Hero({
  profile,
  align,
  className,
  wide,
}: {
  profile: ProfileShape;
  align: "center" | "left";
  className?: string;
  wide?: boolean;
}) {
  const bg = profile.headerBg;
  const isCentered = align === "center";
  const inner = (
    <div
      className={cn(
        "relative mx-auto",
        wide ? "max-w-5xl" : "max-w-3xl",
        "px-4 sm:px-6",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-5",
          isCentered ? "items-center text-center" : "items-start text-left",
        )}
      >
        {profile.avatarUrl && (
          <div className="relative">
            <span
              aria-hidden
              className="absolute -inset-1 rounded-full bg-gradient-to-br from-brand-from to-brand-to opacity-70 blur-[2px]"
            />
            <Image
              src={profile.avatarUrl}
              alt={`Foto profil ${profile.displayName}`}
              width={144}
              height={144}
              unoptimized
              className="relative h-28 w-28 rounded-full object-cover ring-4 ring-background sm:h-32 sm:w-32"
            />
          </div>
        )}
        <div className={cn("space-y-2 max-w-2xl", isCentered ? "" : "")}>
          <h1
            className={cn(
              "font-display text-4xl font-semibold tracking-tight",
              wide && "sm:text-5xl lg:text-6xl",
            )}
            style={
              bg && (bg.kind === "gradient" || bg.kind === "image" || bg.kind === "solid")
                ? { color: pickHeroTextColor(bg) }
                : undefined
            }
          >
            {profile.displayName}
          </h1>
          {profile.targetRole && (
            <p
              className="text-base font-medium opacity-90 sm:text-lg"
              style={
                bg && bg.kind !== "none"
                  ? { color: pickHeroTextColor(bg) }
                  : undefined
              }
            >
              {profile.targetRole}
            </p>
          )}
          {profile.headline && (
            <p
              className="text-sm leading-relaxed opacity-85 sm:text-base"
              style={
                bg && bg.kind !== "none"
                  ? { color: pickHeroTextColor(bg) }
                  : undefined
              }
            >
              {profile.headline}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (!bg || bg.kind === "none") {
    return (
      <section
        className={cn(
          "relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-brand-muted/40 via-background to-background",
          className,
        )}
      >
        <ParangPattern className="text-brand/20" />
        <div className="relative">{inner}</div>
      </section>
    );
  }

  if (bg.kind === "gradient") {
    return (
      <section
        className={cn(
          "relative overflow-hidden bg-gradient-to-br",
          bg.value,
          className,
        )}
      >
        <ParangPattern className="text-white/20" />
        <div className="relative">{inner}</div>
      </section>
    );
  }

  if (bg.kind === "solid") {
    return (
      <section
        className={cn("relative overflow-hidden", className)}
        style={{ background: bg.value }}
      >
        <div className="relative">{inner}</div>
      </section>
    );
  }

  // image
  return (
    <section
      className={cn("relative overflow-hidden", className)}
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.55)), url("${bg.value}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="relative">{inner}</div>
    </section>
  );
}

function pickHeroTextColor(bg: HeaderBg): string {
  if (bg.kind === "image" || bg.kind === "gradient") return "#ffffff";
  if (bg.kind === "solid") return getReadableTextColor(bg.value);
  return "inherit";
}

function getReadableTextColor(hex: string): string {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex);
  if (!m) return "#ffffff";
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // YIQ luminance heuristic.
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#0f172a" : "#ffffff";
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
