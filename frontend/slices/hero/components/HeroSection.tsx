"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Play, Target,
  TrendingUp, Users, CheckCircle
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { BrandMark } from '@/shared/components/brand/Logo';
import { useAuth } from '@/shared/hooks/useAuth';
import { notify } from '@/shared/lib/notify';
import { ROUTES } from '@/shared/lib/routes';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { loginAsDemo } = useAuth();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleDemo = async () => {
    if (isDemoLoading) return;
    setIsDemoLoading(true);
    try {
      const result = await loginAsDemo();
      if (result.ok) {
        notify.success('Sesi demo dimulai 🎉', {
          description: 'Data contoh sudah disiapkan. Selamat menjelajah.',
        });
        router.push(ROUTES.dashboard.home);
      } else {
        notify.error('Demo gagal dimulai', { description: result.error });
      }
    } catch (err) {
      notify.fromError(err, 'Demo gagal dimulai');
    } finally {
      setIsDemoLoading(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-slide-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = heroRef.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const features = [
    { icon: Target, text: 'Pembuat CV ATS-Friendly' },
    { icon: TrendingUp, text: 'Roadmap Skill Interaktif' },
    { icon: CheckCircle, text: 'Ceklis Dokumen' },
    { icon: Users, text: 'Latihan Wawancara' },
  ];

  return (
    <div ref={heroRef} className="relative min-h-[90vh] flex items-center overflow-hidden bg-background">
      {/* Dossier margin rules — replaces blurred blob glows */}
      <div aria-hidden className="absolute inset-y-0 left-[6%] hidden w-px bg-border lg:block" />
      <div aria-hidden className="absolute inset-y-0 left-[8%] hidden w-px bg-border/40 lg:block" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="animate-on-scroll opacity-0 flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <span className="inline-flex items-center gap-2 text-brand">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-brand text-[10px]">01</span>
                Dokumen Karir Anda
              </span>
              <span className="h-px w-8 bg-border" />
              <span>Lokal &amp; Luar Negeri</span>
            </div>

            <div className="animate-on-scroll opacity-0" style={{ animationDelay: '0.1s' }}>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] text-foreground">
                Semua yang Anda Butuhkan
                <br />
                Untuk{' '}
                <span className="relative inline-block whitespace-nowrap">
                  <span className="relative z-10">Karir Impian</span>
                  <span aria-hidden className="absolute inset-x-0 bottom-1 -z-0 h-[0.32em] -rotate-1 bg-brand/25" />
                </span>
              </h1>
            </div>

            <div className="animate-on-scroll opacity-0" style={{ animationDelay: '0.2s' }}>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                Dari pembuatan CV hingga persiapan wawancara, ceklis dokumen hingga roadmap skill —
                starter pack lengkap untuk kesuksesan karir Anda, baik lokal maupun luar negeri.
              </p>
            </div>

            <div className="animate-on-scroll opacity-0" style={{ animationDelay: '0.3s' }}>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  onClick={onGetStarted}
                  className="bg-brand hover:bg-brand text-brand-foreground px-8 py-6 text-lg font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                >
                  Mulai Gratis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleDemo}
                  disabled={isDemoLoading}
                  className="border-border hover:bg-muted/50 px-8 py-6 text-lg font-semibold rounded-lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {isDemoLoading ? 'Memulai sesi demo…' : 'Lihat Demo'}
                </Button>
              </div>
            </div>

            <div className="animate-on-scroll opacity-0" style={{ animationDelay: '0.4s' }}>
              <ul className="space-y-2 border-t border-border/60 pt-4 font-mono text-xs">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <li key={index} className="flex items-baseline gap-2">
                      <span className="text-foreground">{feature.text}</span>
                      <span className="-translate-y-[3px] flex-1 border-b border-dotted border-border" />
                      <Icon className="h-3.5 w-3.5 shrink-0 text-brand" />
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="animate-on-scroll opacity-0" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex h-14 w-14 shrink-0 -rotate-6 items-center justify-center rounded-full border-2 border-dashed border-brand/60 text-center font-mono text-[9px] font-bold uppercase leading-tight text-brand">
                  10rb+
                  <br />
                  Terverifikasi
                </div>
                <p className="text-sm text-muted-foreground">
                  Dipercaya pencari kerja di seluruh Indonesia
                </p>
              </div>
            </div>
          </div>

          {/* Right Content — stacked document sheets */}
          <div className="relative hidden lg:block">
            <div className="relative mx-auto max-w-sm">
              {/* Back sheets peeking out */}
              <div className="absolute inset-0 rotate-3 translate-x-3 translate-y-3 rounded-2xl border border-border bg-muted" />
              <div className="absolute inset-0 -rotate-2 -translate-x-2 translate-y-5 rounded-2xl border border-border bg-brand-muted" />

              {/* Top sheet */}
              <div className="relative bg-card rounded-2xl shadow-md p-8 border border-border animate-slide-up">
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-from to-brand-to flex items-center justify-center text-brand-foreground"
                    style={{ boxShadow: '0 10px 24px -8px oklch(var(--brand) / 0.4)' }}
                  >
                    <BrandMark
                      size={28}
                      stroke="oklch(var(--brand-foreground))"
                      strokeWidth={2.4}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Dashboard Karir</h3>
                    <p className="text-sm text-muted-foreground">Progres Anda dalam satu pandangan</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Kelengkapan Profil</span>
                      <span className="text-sm font-bold text-brand">85%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[85%] bg-gradient-to-r from-brand-from to-brand-to rounded-full" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-brand-muted rounded-xl p-4">
                      <p className="text-2xl font-bold text-brand">12</p>
                      <p className="text-xs text-brand">Lamaran Terkirim</p>
                    </div>
                    <div className="bg-success/10 rounded-xl p-4">
                      <p className="text-2xl font-bold text-success">4</p>
                      <p className="text-xs text-success">Wawancara</p>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm font-medium text-foreground mb-2">Langkah Selanjutnya</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-success" />
                        Lengkapi CV
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-success" />
                        Latihan Wawancara
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-4 h-4 rounded-full border-2 border-brand" />
                        Lamar 5 pekerjaan lagi
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ink-stamp badge — replaces the old floating pulse card */}
              <div className="absolute -right-6 -top-6 flex h-20 w-20 -rotate-12 flex-col items-center justify-center rounded-full border-2 border-dashed border-success bg-card font-mono text-[9px] font-bold uppercase leading-tight text-success shadow-sm">
                Tawaran
                <br />
                Diterima
                <CheckCircle className="mt-1 h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
