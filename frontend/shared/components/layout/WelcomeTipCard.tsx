"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Sparkles, ArrowRight, type LucideIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { usePWAInstall } from "@/shared/hooks/usePWAInstall";
import { Download } from "lucide-react";

/**
 * Small card for the split-hero companion slot. Prioritizes the PWA
 * install prompt when the browser is willing; otherwise rotates a
 * handful of tips keyed off the week number (stable per user per week,
 * fresh over time without random re-renders during a session).
 */

interface Tip {
  icon: LucideIcon;
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
}

const TIPS: ReadonlyArray<Tip> = [
  {
    icon: Sparkles,
    title: "Lengkapi profil dulu",
    body: "Profil lengkap + foto meningkatkan peluang lolos screening ATS hingga 40%.",
    ctaLabel: "Ke Profil",
    href: "/dashboard/settings",
  },
  {
    icon: Sparkles,
    title: "Coba pencocok lowongan",
    body: "Tandai skill Anda, biar AI cari lowongan yang paling cocok.",
    ctaLabel: "Buka Pencocok",
    href: "/dashboard/matcher",
  },
  {
    icon: Sparkles,
    title: "Roadmap membantu fokus",
    body: "Pilih career path — kami susun urutan skill yang perlu dikuasai.",
    ctaLabel: "Lihat Roadmap",
    href: "/dashboard/roadmap",
  },
  {
    icon: Sparkles,
    title: "Latihan wawancara harian",
    body: "5 menit sehari melatih respons STAR bikin wawancara berikutnya lebih tenang.",
    ctaLabel: "Mulai Latihan",
    href: "/dashboard/interview",
  },
];

function weekOfYear(): number {
  const now = new Date();
  const first = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - first.getTime()) / 86400000);
  return Math.floor(days / 7);
}

export function WelcomeTipCard() {
  const { canInstall, install } = usePWAInstall();

  const tip = useMemo(() => {
    const idx = weekOfYear() % TIPS.length;
    return TIPS[idx];
  }, []);

  // PWA install has priority when available — one-shot acquisition flow.
  if (canInstall) {
    return (
      <div className="flex h-full flex-col justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-muted px-2 py-0.5 text-[10px] font-medium text-brand">
            <Download className="h-3 w-3" aria-hidden />
            Aplikasi CareerPack
          </div>
          <h2 className="mt-2 text-sm font-semibold text-foreground">
            Pasang sebagai aplikasi
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Akses lebih cepat, notifikasi push, dan mode offline untuk CV +
            ceklis dokumen.
          </p>
        </div>
        <Button
          onClick={() => install()}
          size="sm"
          className="w-full bg-brand hover:bg-brand"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Pasang Sekarang
        </Button>
      </div>
    );
  }

  const Icon = tip.icon;
  return (
    <div className="flex h-full flex-col justify-between gap-3">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-muted px-2 py-0.5 text-[10px] font-medium text-brand">
          <Icon className="h-3 w-3" aria-hidden />
          Tips Minggu Ini
        </div>
        <h2 className="mt-2 text-sm font-semibold text-foreground">
          {tip.title}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{tip.body}</p>
      </div>
      <Button asChild variant="outline" size="sm" className="w-full">
        <Link href={tip.href}>
          {tip.ctaLabel}
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}
