"use client";

import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  FileText,
  HelpCircle,
  Keyboard,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";

interface FAQItem {
  q: string;
  a: string;
}

const FAQ: ReadonlyArray<FAQItem> = [
  {
    q: "Bagaimana cara membuat CV ATS-friendly?",
    a: "Buka menu CV di sidebar atau bottom nav, pilih format (Nasional atau Internasional), isi tiap bagian (Profil, Pengalaman, Pendidikan, Keterampilan, Sertifikasi, Proyek), lalu klik Pratinjau CV untuk melihat hasil, dan Unduh PDF untuk ekspor. Untuk format Internasional, foto tidak ditampilkan (mengikuti standar ATS internasional).",
  },
  {
    q: "Apakah data saya aman?",
    a: "Semua data tersimpan di database Convex yang dimiliki CareerPack. Password di-hash dengan PBKDF2-SHA256 (100.000 iterasi). Setiap mutasi dilindungi oleh pengecekan kepemilikan — pengguna lain tidak bisa membaca atau mengubah data Anda. Lihat halaman Pengaturan untuk ekspor / hapus data (fitur akan hadir).",
  },
  {
    q: "Saya lupa password, bagaimana reset?",
    a: "Di halaman login, klik 'Lupa password?'. Masukkan email akun Anda, lalu link reset akan dikirim. Link berlaku 1 jam. Untuk keamanan, sistem tidak memberi tahu apakah email terdaftar atau tidak (prevent enumeration).",
  },
  {
    q: "Bagaimana cara menggunakan AI Assistant?",
    a: "AI Assistant ada sebagai tombol bulat (FAB) di pojok kanan bawah (mobile) atau Sidebar (desktop). Anda bisa minta bantuan menulis ringkasan CV, review pengalaman, draft surat lamaran, atau strategi wawancara. AI memakai kuota harian/jam — lihat Pengaturan → AI & Integrasi untuk detail.",
  },
  {
    q: "Saya admin — bagaimana aksesnya?",
    a: "Akses admin dikelola via peran (role). Admin perlu ditetapkan lewat Admin Dashboard oleh admin existing, atau via konfigurasi env `ADMIN_BOOTSTRAP_EMAILS` di backend. Setelah peran terset, ikon Admin muncul di menu pengguna (pojok kanan atas desktop).",
  },
  {
    q: "Export data saya ke tempat lain?",
    a: "Saat ini export CV ke PDF tersedia dari halaman CV. Export data global (GDPR-style) ke JSON sedang direncanakan. Untuk data individual (aplikasi, checklist, roadmap, dst.), Anda bisa screenshot atau print page via Ctrl+P.",
  },
  {
    q: "Apakah CareerPack gratis?",
    a: "Semua fitur inti tersedia gratis. AI Assistant memakai kuota bersama — batas 10 permintaan/menit dan 100/hari per pengguna. Jika kuota habis, tunggu reset otomatis atau hubungi admin.",
  },
  {
    q: "Aplikasi mobile tersedia?",
    a: "Belum ada native app, tapi CareerPack berjalan sebagai PWA. Di Android, Chrome menawarkan 'Tambahkan ke Layar Utama'. Di iOS, Safari → Share → 'Add to Home Screen'. Setelah itu ikon app muncul di home screen, berjalan full-screen tanpa browser chrome.",
  },
];

interface Shortcut {
  keys: string[];
  desc: string;
}

const SHORTCUTS: ReadonlyArray<Shortcut> = [
  { keys: ["Ctrl", "P"], desc: "Cetak halaman saat ini (atau pratinjau CV)" },
  { keys: ["Esc"], desc: "Tutup dialog / drawer / popover aktif" },
  { keys: ["Tab"], desc: "Pindah fokus ke elemen interaktif berikutnya" },
  { keys: ["Shift", "Tab"], desc: "Pindah fokus ke elemen sebelumnya" },
  { keys: ["Enter"], desc: "Aktifkan tombol / submit form yang difokus" },
  { keys: ["Space"], desc: "Toggle checkbox / aktifkan tombol yang difokus" },
];

const SUPPORT_EMAIL = "support@careerpack.org";
const GITHUB_URL = "https://github.com/rahmanef63/CareerPack";
const APP_VERSION = "1.0.0";

export function HelpView() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <ResponsivePageHeader
        title="Pusat Bantuan"
        description="Jawaban cepat, panduan singkat, dan cara menghubungi tim CareerPack."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink
          icon={FileText}
          title="Mulai dengan CV"
          href="/dashboard/cv"
          description="Editor ATS-friendly + ekspor PDF"
        />
        <QuickLink
          icon={Sparkles}
          title="Tanya Asisten AI"
          href="/dashboard"
          description="Klik tombol AI di pojok layar"
        />
        <QuickLink
          icon={ShieldCheck}
          title="Kelola Privasi"
          href="/dashboard/settings"
          description="Pengaturan profil & integrasi AI"
        />
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <HelpCircle className="h-5 w-5 text-brand" />
          Pertanyaan Umum
        </h2>
        <div className="rounded-lg border border-border bg-card">
          {FAQ.map((item, idx) => (
            <details
              key={item.q}
              className="group border-b border-border last:border-b-0"
            >
              <summary className="flex cursor-pointer items-start justify-between gap-4 px-4 py-3 font-medium text-foreground transition-colors hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
                <span>
                  <span className="mr-2 text-xs text-muted-foreground">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {item.q}
                </span>
                <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-4 pt-0 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Keyboard className="h-5 w-5 text-brand" />
          Pintasan Keyboard
        </h2>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {SHORTCUTS.map((s) => (
                  <tr key={s.keys.join("+")}>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span className="flex gap-1">
                        {s.keys.map((k, i) => (
                          <span key={k}>
                            <kbd className="inline-flex min-w-[1.75rem] items-center justify-center rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
                              {k}
                            </kbd>
                            {i < s.keys.length - 1 && (
                              <span className="mx-1 text-muted-foreground">+</span>
                            )}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {s.desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-brand" />
              Hubungi Dukungan
            </CardTitle>
            <CardDescription>
              Kirim email ke tim CareerPack untuk bug, saran, atau bantuan akun.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a href={`mailto:${SUPPORT_EMAIL}?subject=CareerPack%20Support`}>
                <Mail className="mr-2 h-4 w-4" />
                {SUPPORT_EMAIL}
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-brand" />
              Lapor Bug di GitHub
            </CardTitle>
            <CardDescription>
              Untuk pengembang: buat issue dengan langkah reproduksi yang jelas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a href={`${GITHUB_URL}/issues/new`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                Buka GitHub Issues
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col items-start gap-2 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Versi aplikasi</p>
          <p className="text-xs text-muted-foreground">
            Panduan lengkap: lihat README repositori & folder docs/
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            v{APP_VERSION}
          </Badge>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <BookOpen className="mr-2 h-4 w-4" />
              Kembali ke Dashboard
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

interface QuickLinkProps {
  icon: React.ElementType;
  title: string;
  href: string;
  description: string;
}

function QuickLink({ icon: Icon, title, href, description }: QuickLinkProps) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-brand hover:bg-muted/30"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-muted text-brand group-hover:bg-brand group-hover:text-brand-foreground transition-colors">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-0.5">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
