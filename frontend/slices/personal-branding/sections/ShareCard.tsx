"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { Linkedin, Share2, Twitter, MessageCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { CodeBlock } from "@/shared/components/ui/copy-button";

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
  // Probed after mount, not during render: `navigator` doesn't exist during SSR
  // and a render-time check would hydrate into a mismatch.
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
  }, []);

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

  async function nativeShare() {
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
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning-text">
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
          {/* The only deliberately un-themed surface in this slice: a QR
              needs a light quiet zone and a dark modules-on-light contrast
              ratio to scan. Themed to `bg-card`/`foreground` it would invert
              under any dark preset and stop scanning on half the phones it
              exists for. */}
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
            <CodeBlock value={url} label="Salin URL halaman publik" />
            <div className="flex flex-wrap gap-2">
              {/* Hidden rather than falling back to a copy: the CodeBlock above
                  is already that fallback, one row up. */}
              {canShare && (
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
              )}
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
