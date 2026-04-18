"use client";

import { useEffect, useRef } from 'react';
import {
  ArrowRight, Sparkles, Target,
  TrendingUp, Users, CheckCircle
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { BrandMark } from '@/shared/components/Logo';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const heroRef = useRef<HTMLDivElement>(null);

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
    <div ref={heroRef} className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-career-50 via-white to-career-100" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-career-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-career-300/20 rounded-full blur-3xl" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(90deg, #0ea5e9 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="animate-on-scroll opacity-0">
              <Badge 
                variant="secondary" 
                className="bg-career-100 text-career-700 hover:bg-career-200 px-4 py-1.5 text-sm font-medium"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Perjalanan Karir Anda Dimulai di Sini
              </Badge>
            </div>

            <div className="animate-on-scroll opacity-0" style={{ animationDelay: '0.1s' }}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-slate-900">Semua yang Anda Butuhkan</span>
                <br />
                <span className="brand-gradient-text">
                  Untuk Karir Impian
                </span>
              </h1>
            </div>

            <div className="animate-on-scroll opacity-0" style={{ animationDelay: '0.2s' }}>
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                Dari pembuatan CV hingga persiapan wawancara, ceklis dokumen hingga roadmap skill — 
                starter pack lengkap untuk kesuksesan karir Anda, baik lokal maupun luar negeri.
              </p>
            </div>

            <div className="animate-on-scroll opacity-0" style={{ animationDelay: '0.3s' }}>
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  onClick={onGetStarted}
                  className="bg-career-600 hover:bg-career-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg shadow-career-500/25 hover:shadow-career-500/40 transition-all duration-300"
                >
                  Mulai Gratis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-slate-300 hover:bg-slate-50 px-8 py-6 text-lg font-semibold rounded-xl"
                >
                  Lihat Demo
                </Button>
              </div>
            </div>

            <div className="animate-on-scroll opacity-0" style={{ animationDelay: '0.4s' }}>
              <div className="flex flex-wrap gap-4 pt-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <div className="w-6 h-6 rounded-full bg-career-100 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-career-600" />
                      </div>
                      {feature.text}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="animate-on-scroll opacity-0" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-career-400 to-career-600 flex items-center justify-center text-white text-xs font-bold"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">10,000+ Pencari Kerja</p>
                  <p className="text-xs text-slate-500">Percaya pada CareerPack</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Visual */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Main Card */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 animate-float">
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white"
                    style={{ boxShadow: '0 10px 24px -8px rgba(14,165,233,0.4)' }}
                  >
                    <BrandMark size={28} stroke="#fff" strokeWidth={2.4} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Dashboard Karir</h3>
                    <p className="text-sm text-slate-500">Progres Anda dalam satu pandangan</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-600">Kelengkapan Profil</span>
                      <span className="text-sm font-bold text-career-600">85%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full w-[85%] bg-gradient-to-r from-career-500 to-career-600 rounded-full" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-career-50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-career-700">12</p>
                      <p className="text-xs text-career-600">Lamaran Terkirim</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-green-700">4</p>
                      <p className="text-xs text-green-600">Wawancara</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Langkah Selanjutnya</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Lengkapi CV
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Latihan Wawancara
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <div className="w-4 h-4 rounded-full border-2 border-career-500" />
                        Lamar 5 pekerjaan lagi
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-lg p-4 border border-slate-100 animate-pulse-glow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Tawaran Diterima!</p>
                    <p className="text-xs text-slate-500">Tech Corp Ltd.</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg p-4 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-career-100 flex items-center justify-center">
                    <Target className="w-5 h-5 text-career-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Target Tercapai</p>
                    <p className="text-xs text-slate-500">10 lamaran minggu ini</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
