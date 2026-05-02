"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  Briefcase,
  FileUser,
  Info,
  MessageSquare,
  TrendingUp,
  Target,
  Clock,
  Plus,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/shared/components/ui/responsive-tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { useApplications } from "@/shared/hooks/useApplications";
import { formatDateShort, formatMonthShort } from "@/shared/lib/formatDate";
import { useAgenda } from "@/shared/hooks/useAgenda";
import { useAuth } from "@/shared/hooks/useAuth";
import { ErrorBoundary } from "@/shared/components/error/ErrorBoundary";
import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { QuickFillButton } from "@/shared/components/onboarding";
import { Breadcrumb } from "@/shared/components/layout/Breadcrumb";
import { DashboardTwoCol } from "@/shared/components/layout/DashboardTwoCol";
import { NextActionCard } from "@/shared/components/layout/NextActionCard";
import { ScheduleCard } from "@/shared/components/layout/ScheduleCard";
import { WelcomeTipCard } from "@/shared/components/layout/WelcomeTipCard";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { StatCard } from "@/shared/components/stats/StatCard";
import { Reveal } from "@/shared/components/motion/Reveal";
import { ProfileCompletenessCard } from "./ProfileCompletenessCard";
import { OnboardingWizard } from "./OnboardingWizard";

/**
 * Recharts (~100 kB gz) is deferred until after first paint — the
 * skeleton reserves the same 260px height so the KPI strip above
 * doesn't layout-shift when the chart hydrates.
 */
const DashboardTrendChart = dynamic(
  () => import("./DashboardTrendChart"),
  {
    ssr: false,
    loading: () => (
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Tren Lamaran 8 Minggu</CardTitle>
          <CardDescription>
            Volume lamaran mingguan dan yang dipanggil wawancara.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[260px] w-full animate-pulse rounded-lg bg-muted/40" />
        </CardContent>
      </Card>
    ),
  },
);

export function DashboardHome() {
  const [wizardOpen, setWizardOpen] = useState(false);

  const { state } = useAuth();
  const { applications, isLoading: loadingApps } = useApplications();

  const stats = useMemo(() => {
    const interview = applications.filter((a) => a.status === "interview").length;
    const offer = applications.filter((a) => a.status === "offer").length;
    const applied = applications.filter((a) => a.status === "applied").length;
    const RESPONSE_MIN = 5;
    const responseRate =
      applications.length === 0
        ? 0
        : Math.round(
            (applications.filter((a) => a.status !== "applied").length /
              applications.length) *
              100
          );
    // "Tingkat Respons" butuh baseline data cukup agar tidak menyesatkan.
    // 1 lamaran + 1 wawancara = 100% teknis benar tapi tidak bermakna.
    const responseRateReliable = applications.length >= RESPONSE_MIN;
    return {
      total: applications.length,
      interview,
      offer,
      applied,
      responseRate,
      responseRateReliable,
      responseMin: RESPONSE_MIN,
    };
  }, [applications]);

  const chartData = useMemo(() => {
    // Group applications per ISO week label (8 minggu terakhir)
    const weeks: { name: string; lamaran: number; wawancara: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      weeks.push({
        name: formatDateShort(d),
        lamaran: 0,
        wawancara: 0,
      });
    }
    applications.forEach((a) => {
      const applied = new Date(a.appliedDate);
      const ageWeeks = Math.floor(
        (Date.now() - applied.getTime()) / (7 * 86400000)
      );
      if (ageWeeks >= 0 && ageWeeks < 8) {
        const idx = 7 - ageWeeks;
        weeks[idx].lamaran += 1;
        if (a.status === "interview" || a.status === "offer") {
          weeks[idx].wawancara += 1;
        }
      }
    });
    return weeks;
  }, [applications]);

  // Greeting name: profile fullName > first-name-from-email > "pengguna".
  // Hindari tampil "Halo, user@domain.com" saat profile belum diisi — useAuth
  // fallback `name` ke email untuk internal use, tapi UI greeting mesti
  // manusiawi.
  const rawName = state.user?.name || "";
  const looksLikeEmail = rawName.includes("@");
  const firstName = looksLikeEmail
    ? rawName.split("@")[0].replace(/[._-]/g, " ").split(" ")[0] || "pengguna"
    : rawName.split(" ")[0] || "pengguna";

  return (
    <PageContainer size="xl" className="flex flex-col gap-6">
      <Reveal id="dash-hero" delay={0}>
        <ResponsivePageHeader
          variant="split"
          breadcrumb={<Breadcrumb />}
          title={<>Halo, {firstName} <span aria-hidden>👋</span></>}
          description="Ini ringkasan progres karir Anda minggu ini."
          actions={<QuickFillButton variant="outline" size="sm" className="gap-2" />}
          companion={<WelcomeTipCard />}
        />
      </Reveal>

      <Reveal id="dash-completeness" delay={40}>
        <ProfileCompletenessCard onStartWizard={() => setWizardOpen(true)} />
      </Reveal>

      <OnboardingWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      <DashboardTwoCol
        rail={
          <>
            <ScheduleCard />
            <NextActionCard />
          </>
        }
      >
      {/* KPI bento — 2-col on mobile (2×2 grid), 4-col on desktop.
          First card spans 2 cols on mobile for visual rhythm. */}
      <Reveal id="dash-kpi" delay={80} className="block">
      <section
        className="grid gap-3 grid-cols-2 md:grid-cols-4 [&>*:first-child]:col-span-2 md:[&>*:first-child]:col-span-1"
        aria-label="Ringkasan statistik"
      >
        <StatCard
          icon={Briefcase}
          label="Total Lamaran"
          value={loadingApps ? "—" : stats.total}
          sub={stats.applied > 0 ? `${stats.applied} masih diproses` : "Mulai melamar"}
          tone="sky"
        />
        <StatCard
          icon={MessageSquare}
          label="Wawancara"
          value={loadingApps ? "—" : stats.interview}
          sub={
            stats.interview > 0 ? (
              <span className="inline-flex items-center gap-1">
                Siapkan jawaban STAR
                <ResponsiveTooltip>
                  <ResponsiveTooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                      aria-label="Apa itu STAR?"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </ResponsiveTooltipTrigger>
                  <ResponsiveTooltipContent>
                    <p className="font-medium">Metode STAR</p>
                    <p className="text-muted-foreground">
                      Situation, Task, Action, Result — kerangka jawab
                      pertanyaan wawancara perilaku. Ceritakan situasi + tugas
                      + aksi yang kamu ambil + hasilnya.
                    </p>
                  </ResponsiveTooltipContent>
                </ResponsiveTooltip>
              </span>
            ) : (
              "Belum ada wawancara"
            )
          }
          tone="violet"
        />
        <StatCard
          icon={Target}
          label="Tawaran Diterima"
          value={loadingApps ? "—" : stats.offer}
          sub={stats.offer > 0 ? "Selamat!" : "Terus semangat"}
          tone="success"
        />
        <StatCard
          icon={TrendingUp}
          label="Tingkat Respons"
          value={
            loadingApps
              ? "—"
              : stats.responseRateReliable
                ? `${stats.responseRate}%`
                : "—"
          }
          sub={
            loadingApps
              ? ""
              : stats.responseRateReliable
                ? stats.responseRate >= 50
                  ? "Di atas rata-rata"
                  : "Tingkatkan kualitas CV"
                : `Butuh min. ${stats.responseMin} lamaran untuk statistik akurat`
          }
          tone="warning"
        />
      </section>
      </Reveal>

      {/* Chart + Quick actions */}
      <Reveal id="dash-chart" delay={160} className="block">
      <div className="grid gap-4 xl:grid-cols-3">
        <DashboardTrendChart
          data={chartData}
          totalApplications={stats.total}
        />

        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Lompat ke tugas utama</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild className="justify-between bg-brand hover:bg-brand">
              <Link href="/dashboard/applications">
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Tambah Lamaran
                </span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link href="/dashboard/cv">
                <span className="flex items-center gap-2">
                  <FileUser className="w-4 h-4" /> Lihat / Edit CV
                </span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link href="/dashboard/interview">
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Latihan Wawancara
                </span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
            <Separator />
            <Button asChild variant="ghost" className="justify-between text-brand">
              <Link href="/dashboard/calendar">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Mulai chat dengan AI
                </span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      </Reveal>

      {/* Upcoming agenda — terbungkus ErrorBoundary supaya kalau
          query Convex (calendar) belum di-deploy, dashboard tetap render. */}
      <Reveal id="dash-agenda" delay={240} className="block">
        <ErrorBoundary title="Agenda Terdekat tidak tersedia">
          <AgendaSection />
        </ErrorBoundary>
      </Reveal>
      </DashboardTwoCol>
    </PageContainer>
  );
}

/**
 * Section terisolasi: hook `useAgenda` dipanggil di sini, bukan di
 * top-level DashboardHome. Kalau query throw, ErrorBoundary parent
 * yang menangkap.
 */
function AgendaSection() {
  const { items: agenda, isLoading: loadingAgenda } = useAgenda();
  const upcomingAgenda = useMemo(
    () =>
      agenda
        .filter((a) => a.date >= new Date().toISOString().slice(0, 10))
        .sort((a, b) =>
          a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)
        )
        .slice(0, 4),
    [agenda]
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Agenda Terdekat</CardTitle>
          <CardDescription>
            Wawancara, tenggat, dan follow-up mendatang
          </CardDescription>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/calendar">Lihat semua</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loadingAgenda ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Memuat…</p>
        ) : upcomingAgenda.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              Belum ada agenda mendatang.
            </p>
            <Button asChild size="sm" className="mt-3">
              <Link href="/dashboard/calendar">
                <Plus className="w-4 h-4 mr-1" /> Tambah Agenda
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {upcomingAgenda.map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/40"
              >
                <div className="w-10 h-10 rounded-lg bg-background border flex flex-col items-center justify-center">
                  <span className="text-[9px] uppercase text-muted-foreground font-medium">
                    {formatMonthShort(it.date)}
                  </span>
                  <span className="text-sm font-bold leading-none">
                    {new Date(it.date).getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{it.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Clock className="w-3 h-3" /> {it.time} · {it.location}
                  </p>
                </div>
                <Badge variant="secondary" className="capitalize text-[10px]">
                  {typeLabel(it.type)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        {upcomingAgenda.length} agenda ditampilkan
      </CardFooter>
    </Card>
  );
}

function typeLabel(t: string): string {
  if (t === "interview") return "Wawancara";
  if (t === "deadline") return "Tenggat";
  if (t === "followup") return "Follow-up";
  return t;
}

// StatCard consolidated into @/shared/components/stats/StatCard —
// imported at the top of this file. Local "green" / "amber" tone
// aliases are now "success" / "warning" in the shared component.
