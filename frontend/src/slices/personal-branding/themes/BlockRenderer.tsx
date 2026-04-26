"use client";

import Image from "next/image";
import {
  Linkedin,
  Instagram,
  Twitter,
  Github,
  Youtube,
  Music2,
  Dribbble,
  Facebook,
  MessageCircle,
  Mail,
  Globe,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type {
  Block,
  EmbedPayload,
  HeadingPayload,
  ImagePayload,
  LinkPayload,
  ParagraphPayload,
  SocialPayload,
  SocialPlatform,
  HtmlPayload,
  DividerPayload,
} from "../blocks/types";

const SOCIAL_ICONS: Record<SocialPlatform, typeof Linkedin> = {
  linkedin: Linkedin,
  instagram: Instagram,
  twitter: Twitter,
  github: Github,
  youtube: Youtube,
  tiktok: Music2,
  dribbble: Dribbble,
  behance: Dribbble,
  facebook: Facebook,
  whatsapp: MessageCircle,
  email: Mail,
  website: Globe,
};

const SOCIAL_LABEL: Record<SocialPlatform, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  twitter: "X",
  github: "GitHub",
  youtube: "YouTube",
  tiktok: "TikTok",
  dribbble: "Dribbble",
  behance: "Behance",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  email: "Email",
  website: "Website",
};

interface BlockRendererProps {
  block: Block;
  /** When true, the linktree-style "tile" wrapper is applied. */
  decorate?: boolean;
}

/**
 * Renders a single block. Theme-agnostic — each theme decides
 * spacing/wrapping; we just emit the inner element.
 *
 * Embed renders use canonical iframe URLs constructed from the
 * (provider, id) pair stored server-side, never a user-supplied raw
 * URL or iframe markup.
 */
export function BlockRenderer({ block }: BlockRendererProps) {
  if (block.hidden) return null;
  switch (block.type) {
    case "heading":
      return <HeadingBlock payload={block.payload as HeadingPayload} />;
    case "paragraph":
      return <ParagraphBlock payload={block.payload as ParagraphPayload} />;
    case "link":
      return <LinkBlock payload={block.payload as LinkPayload} />;
    case "social":
      return <SocialBlock payload={block.payload as SocialPayload} />;
    case "image":
      return <ImageBlock payload={block.payload as ImagePayload} />;
    case "embed":
      return <EmbedBlock payload={block.payload as EmbedPayload} />;
    case "divider":
      return <DividerBlock payload={block.payload as DividerPayload} />;
    case "html":
      return <HtmlBlock payload={block.payload as HtmlPayload} />;
    default:
      return null;
  }
}

function HeadingBlock({ payload }: { payload: HeadingPayload }) {
  const className =
    payload.size === "md"
      ? "text-xl font-semibold tracking-tight text-foreground"
      : "font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground";
  return <h2 className={className}>{payload.text}</h2>;
}

/** Lightweight markdown-ish renderer: bolds **a**, italics _b_, links
 *  [label](url). Server already strips control chars; we still escape
 *  HTML entities before swapping in tags. */
function inlineMarkdown(text: string): { __html: string } {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  let s = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>");
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 hover:text-brand">$1</a>',
  );
  s = s.replace(/\n/g, "<br />");
  return { __html: s };
}

function ParagraphBlock({ payload }: { payload: ParagraphPayload }) {
  return (
    <p
      className="text-base leading-relaxed text-foreground/85"
      dangerouslySetInnerHTML={inlineMarkdown(payload.text)}
    />
  );
}

function LinkBlock({ payload }: { payload: LinkPayload }) {
  const variant =
    payload.variant === "secondary"
      ? "border border-border bg-card hover:bg-accent text-foreground"
      : payload.variant === "ghost"
        ? "border border-dashed border-border bg-transparent hover:bg-accent text-foreground"
        : "border border-brand/40 bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground hover:opacity-90";
  return (
    <a
      href={payload.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-center justify-between gap-3 rounded-2xl px-5 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        variant,
      )}
    >
      <span className="flex items-center gap-3 min-w-0">
        {payload.emoji && (
          <span className="text-xl shrink-0" aria-hidden>
            {payload.emoji}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold sm:text-base">
            {payload.label}
          </span>
          {payload.description && (
            <span className="block truncate text-xs opacity-80">
              {payload.description}
            </span>
          )}
        </span>
      </span>
      <ExternalLink className="h-4 w-4 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}

function SocialBlock({ payload }: { payload: SocialPayload }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {payload.items.map((it, i) => {
        const Icon = SOCIAL_ICONS[it.platform];
        return (
          <a
            key={`${it.platform}-${i}`}
            href={it.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={SOCIAL_LABEL[it.platform]}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground/80 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand hover:shadow-md"
          >
            <Icon className="h-5 w-5" />
          </a>
        );
      })}
    </div>
  );
}

function ImageBlock({ payload }: { payload: ImagePayload }) {
  const node = (
    <figure className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative aspect-video w-full">
        {/* `unoptimized` because external URLs may not be in the Next
         * image domain allowlist; we already validated protocol on the
         * server. */}
        <Image
          src={payload.url}
          alt={payload.alt}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, 600px"
          className="object-cover"
        />
      </div>
      {payload.caption && (
        <figcaption className="px-4 py-2 text-xs text-muted-foreground">
          {payload.caption}
        </figcaption>
      )}
    </figure>
  );
  if (payload.link) {
    return (
      <a
        href={payload.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {node}
      </a>
    );
  }
  return node;
}

function EmbedBlock({ payload }: { payload: EmbedPayload }) {
  const src = embedSrc(payload);
  if (!src) return null;
  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-black">
      <div className="aspect-video w-full">
        <iframe
          src={src}
          title={`Embedded ${payload.provider}`}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          className="h-full w-full"
        />
      </div>
      {payload.caption && (
        <figcaption className="bg-card px-4 py-2 text-xs text-muted-foreground">
          {payload.caption}
        </figcaption>
      )}
    </figure>
  );
}

function embedSrc(p: EmbedPayload): string | null {
  switch (p.provider) {
    case "youtube":
      return `https://www.youtube-nocookie.com/embed/${p.id}`;
    case "vimeo":
      return `https://player.vimeo.com/video/${p.id}`;
    case "spotify":
      return `https://open.spotify.com/embed/${p.id}`;
    case "soundcloud":
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(p.id)}`;
    default:
      return null;
  }
}

function DividerBlock({ payload }: { payload: DividerPayload }) {
  if (payload.style === "dot") {
    return (
      <div className="flex justify-center gap-2 py-2 text-muted-foreground/60">
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      </div>
    );
  }
  return <hr className="border-border" />;
}

function HtmlBlock({ payload }: { payload: HtmlPayload }) {
  // Server already sanitised. We render via dangerouslySetInnerHTML —
  // the prose-* utilities give consistent typography for headings/lists/
  // links inside the user's markup.
  return (
    <div
      className="prose prose-sm max-w-none dark:prose-invert prose-a:text-brand"
      dangerouslySetInnerHTML={{ __html: payload.content }}
    />
  );
}
