"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/shared/lib/utils";
import { BrandMark } from "@/shared/components/brand/Logo";
import { ParangPattern } from "@/shared/components/decor/ParangPattern";
import { BlockRenderer } from "./BlockRenderer";
import type {
  Block,
  HeaderBg,
  PersonalBrandingTheme,
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
