"use client";

import { useMemo, useState } from "react";
import { Check, Code2, Copy, Globe2, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { notify } from "@/shared/lib/notify";
import { cn } from "@/shared/lib/utils";
import type { Bind, FormState, SectionOverrides } from "../form/types";

/**
 * Snapshot of profile data the prompt template needs. Pulled from
 * `getCurrentUser` (real) or the demo overlay — parent decides which
 * source to feed in. Kept as a flat shape so the component stays
 * pure-presentational and testable.
 */
export interface ExportProfileSnapshot {
  fullName: string;
  bio: string;
  location: string;
  targetRole: string;
  experienceLevel: string;
  skills: string[];
}

export interface ExportCardProps extends SectionOverrides {
  bind: Bind;
  state: FormState;
  /** Lowercased trimmed slug — used for absolute public URL. */
  slugTrimmed: string;
  /** User-data snapshot used to render the AI Prompt body. */
  profile: ExportProfileSnapshot;
  /** Origin override for snippets. Defaults to careerpack.org. */
  origin?: string;
}

const DEFAULT_ORIGIN = "https://careerpack.org";

export function ExportCard({
  bind,
  state,
  slugTrimmed,
  profile,
  origin = DEFAULT_ORIGIN,
  title = "Bagikan & Ekspor",
  description = "Tiga format ringkas untuk pakai data profil di luar CareerPack — masing-masing toggle independen.",
  className,
}: ExportCardProps) {
  const html = bind("htmlExport");
  const embed = bind("embedExport");
  const prompt = bind("promptExport");

  const publicUrl = slugTrimmed
    ? `${origin}/${slugTrimmed}`
    : `${origin}/<slug-anda>`;
  const slugReady = Boolean(slugTrimmed);

  const htmlSnippet = useMemo(
    () =>
      buildHtmlCard({
        name: profile.fullName || "Nama Anda",
        headline: state.headline || profile.targetRole || "Profesional",
        bio: profile.bio,
        publicUrl,
      }),
    [profile.fullName, profile.targetRole, profile.bio, state.headline, publicUrl],
  );

  const embedSnippet = useMemo(
    () => buildEmbedSnippet(publicUrl),
    [publicUrl],
  );

  const promptSnippet = useMemo(
    () =>
      buildPromptText({
        name: profile.fullName || "Nama Anda",
        headline: state.headline,
        location: profile.location,
        targetRole: profile.targetRole,
        experienceLevel: profile.experienceLevel,
        bio: profile.bio,
        skills: profile.skills,
        contactEmail: state.contactEmail,
        linkedinUrl: state.linkedinUrl,
        portfolioUrl: state.portfolioUrl,
        publicUrl,
      }),
    [profile, state, publicUrl],
  );

  const enabledCount = [html.value, embed.value, prompt.value].filter(Boolean)
    .length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {enabledCount}/3 aktif
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="html">
          <TabsList variant="pills">
            <TabsTrigger value="html" className="gap-1.5">
              <Code2 className="h-4 w-4" />
              <span>HTML</span>
              {html.value && <Dot />}
            </TabsTrigger>
            <TabsTrigger value="embed" className="gap-1.5">
              <Globe2 className="h-4 w-4" />
              <span>Embed</span>
              {embed.value && <Dot />}
            </TabsTrigger>
            <TabsTrigger value="prompt" className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span>Prompt AI</span>
              {prompt.value && <Dot />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="html" className="mt-4">
            <ExportPanel
              enabled={html.value}
              onToggle={html.onChange}
              code={htmlSnippet}
              hint="Kartu HTML self-contained — tempel ke website mana pun (blog, portofolio sendiri, README)."
              disabledNote={
                !slugReady
                  ? "Tetapkan slug dulu agar URL kartu valid."
                  : undefined
              }
              fileName="profile-card.html"
            />
          </TabsContent>

          <TabsContent value="embed" className="mt-4">
            <ExportPanel
              enabled={embed.value}
              onToggle={embed.onChange}
              code={embedSnippet}
              hint="Iframe yang menyematkan halaman publik Anda. Cocok untuk Notion, Wix, Wordpress."
              disabledNote={
                !slugReady
                  ? "Tetapkan slug dulu agar URL iframe valid."
                  : undefined
              }
              fileName="profile-embed.html"
            />
          </TabsContent>

          <TabsContent value="prompt" className="mt-4">
            <ExportPanel
              enabled={prompt.value}
              onToggle={prompt.onChange}
              code={promptSnippet}
              hint="Tempel ke ChatGPT / Claude / Gemini supaya AI tahu konteks Anda — siapkan cold email, draft cover letter, dsb."
              fileName="profile-prompt.txt"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function Dot() {
  return (
    <span
      aria-hidden
      className="ml-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
    />
  );
}

interface ExportPanelProps {
  enabled: boolean;
  onToggle: (next: boolean) => void;
  code: string;
  hint: string;
  fileName: string;
  /** Optional disabled-state note (e.g. "set slug first"). */
  disabledNote?: string;
}

function ExportPanel({
  enabled,
  onToggle,
  code,
  hint,
  fileName,
  disabledNote,
}: ExportPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      notify.success("Disalin ke clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      notify.warning("Browser memblokir clipboard — pilih & salin manual.");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-medium">Aktifkan ekspor</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
          {disabledNote && (
            <p className="text-xs text-warning">{disabledNote}</p>
          )}
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          aria-label="Toggle ekspor"
        />
      </div>

      {enabled ? (
        <div className="relative">
          <Textarea
            value={code}
            readOnly
            rows={12}
            className={cn(
              "font-mono text-xs resize-y bg-muted/20 pr-24",
              "selection:bg-brand-muted selection:text-brand",
            )}
            aria-label="Kode ekspor"
          />
          <div className="absolute right-2 top-2 flex gap-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1.5 h-7 px-2 text-xs"
              onClick={(e) => {
                e.currentTarget.blur();
                void handleCopy();
              }}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" /> Disalin
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Salin
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.currentTarget.blur();
                handleDownload();
              }}
            >
              .file
            </Button>
          </div>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-xs text-muted-foreground">
          Aktifkan toggle di atas untuk lihat & salin kode.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Generators — pure functions (no React) so they're trivial to test.
// ---------------------------------------------------------------------

interface HtmlInputs {
  name: string;
  headline: string;
  bio: string;
  publicUrl: string;
}

function buildHtmlCard({ name, headline, bio, publicUrl }: HtmlInputs): string {
  const safeBio = bio.trim() || "Lihat profil lengkap untuk detail pengalaman, skill, dan portofolio.";
  return [
    "<!-- CareerPack profile card — paste anywhere; tweak styles as you like. -->",
    '<article style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;padding:24px;border-radius:16px;background:linear-gradient(135deg,#06b6d4,#7c3aed);color:#fff;box-shadow:0 12px 36px -12px rgba(124,58,237,.45);">',
    `  <h2 style="margin:0 0 4px;font-size:22px;font-weight:600;">${escapeHtml(name)}</h2>`,
    `  <p style="margin:0;opacity:.85;font-size:14px;">${escapeHtml(headline)}</p>`,
    `  <p style="margin:14px 0;line-height:1.5;font-size:13px;opacity:.92;">${escapeHtml(safeBio)}</p>`,
    `  <a href="${escapeHtml(publicUrl)}" style="display:inline-block;padding:8px 14px;border-radius:9999px;background:#fff;color:#0f172a;text-decoration:none;font-weight:600;font-size:13px;">Lihat profil lengkap →</a>`,
    "</article>",
  ].join("\n");
}

function buildEmbedSnippet(publicUrl: string): string {
  return [
    "<!-- CareerPack profile embed -->",
    "<iframe",
    `  src="${publicUrl}?embed=1"`,
    '  width="100%"',
    '  height="640"',
    '  loading="lazy"',
    `  title="Profil CareerPack"`,
    '  style="border:0;border-radius:12px;max-width:480px;display:block;"',
    "></iframe>",
  ].join("\n");
}

interface PromptInputs {
  name: string;
  headline: string;
  location: string;
  targetRole: string;
  experienceLevel: string;
  bio: string;
  skills: string[];
  contactEmail: string;
  linkedinUrl: string;
  portfolioUrl: string;
  publicUrl: string;
}

function buildPromptText(p: PromptInputs): string {
  const lines: string[] = [];
  lines.push("Anda adalah asisten karir. Berikut konteks profil pengguna:");
  lines.push("");
  lines.push(`NAMA: ${p.name}`);
  if (p.headline) lines.push(`HEADLINE: ${p.headline}`);
  if (p.location) lines.push(`LOKASI: ${p.location}`);
  if (p.targetRole) lines.push(`TARGET ROLE: ${p.targetRole}`);
  if (p.experienceLevel) lines.push(`LEVEL: ${p.experienceLevel}`);
  if (p.bio) {
    lines.push("");
    lines.push("BIO:");
    lines.push(p.bio);
  }
  if (p.skills.length > 0) {
    lines.push("");
    lines.push(`SKILL UTAMA: ${p.skills.join(", ")}`);
  }
  const links: string[] = [];
  if (p.publicUrl) links.push(`Halaman publik: ${p.publicUrl}`);
  if (p.linkedinUrl) links.push(`LinkedIn: ${p.linkedinUrl}`);
  if (p.portfolioUrl) links.push(`Portofolio: ${p.portfolioUrl}`);
  if (p.contactEmail) links.push(`Email: ${p.contactEmail}`);
  if (links.length > 0) {
    lines.push("");
    lines.push("TAUTAN:");
    for (const l of links) lines.push(`- ${l}`);
  }
  lines.push("");
  lines.push("TUGAS: [tulis tujuan Anda di sini, mis. \"draft cold email ke recruiter\"]");
  lines.push("");
  lines.push("GAYA: ringkas, sopan, Bahasa Indonesia formal — referensikan poin di atas saat relevan.");
  return lines.join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
