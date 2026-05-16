"use client";

import { useMemo, useState } from "react";
import QRCode from "react-qr-code";
import {
  Check,
  Copy,
  Linkedin,
  Share2,
  Twitter,
  MessageCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { notify } from "@/shared/lib/notify";

export interface ShareCardProps {
  /** Trimmed slug — empty string when not yet published. */
  slugTrimmed: string;
  /** Display name used in share-text headline. */
  displayName: string;
  /** Whether the public page is enabled (controls the disabled state). */
  enabled: boolean;
}

const SITE_BASE = "https://careerpack.org";

/**
 * Share + QR card for the public page. Renders only when a slug is
 * present so we don't mock-share an unpublished URL. Pure client —
 * no Convex round-trips, no external API calls.
 */
export function ShareCard({ slugTrimmed, displayName, enabled }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const url = slugTrimmed ? `${SITE_BASE}/${slugTrimmed}` : "";
  const shareText = useMemo(() => {
    const name = displayName?.trim() || "halaman karier saya";
    return `Lihat ${name} di CareerPack: ${url}`;
  }, [displayName, url]);

  if (!slugTrimmed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle as="h3" className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4 text-muted-foreground" />
            Bagikan halaman publik
          </CardTitle>
          <CardDescription>
            Set slug + publikasikan dulu untuk mendapatkan QR code dan
            tombol bagikan.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      notify.success("URL disalin");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.warning("Gagal menyalin — salin manual dari kolom URL");
    }
  }

  async function nativeShare() {
    if (typeof navigator.share !== "function") {
      copyUrl();
      return;
    }
    try {
      await navigator.share({
        title: displayName || "CareerPack",
        text: shareText,
        url,
      });
    } catch {
      // User cancelled — silent.
    }
  }

  const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const twitterShare = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle as="h3" className="flex items-center gap-2 text-base">
          <Share2 className="h-4 w-4 text-brand" />
          Bagikan halaman publik
          {!enabled && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              Draft
            </span>
          )}
        </CardTitle>
        <CardDescription>
          QR code untuk kartu nama / event offline, plus shortcut share
          ke LinkedIn, X, WhatsApp.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex shrink-0 items-center justify-center rounded-xl border border-border bg-white p-3 shadow-sm">
            <QRCode
              value={url}
              size={140}
              bgColor="#ffffff"
              fgColor="#0f172a"
              level="M"
              aria-label={`QR code untuk ${url}`}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
              <span className="truncate font-mono text-foreground" title={url}>
                {url}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyUrl}
                className="h-7 shrink-0 gap-1 px-2"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span className="text-[11px]">
                  {copied ? "Disalin" : "Salin"}
                </span>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={nativeShare}
                className="gap-1.5"
              >
                <Share2 className="h-3.5 w-3.5" />
                Bagikan
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <a
                  href={linkedinShare}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                  LinkedIn
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <a href={twitterShare} target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-3.5 w-3.5" />X / Twitter
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <a
                  href={whatsappShare}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Tip: simpan QR di slide presentasi, di belakang kartu nama,
              atau di bio Instagram untuk traffic offline → online.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
