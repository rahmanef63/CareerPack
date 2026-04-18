"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Briefcase,
  FileUser,
  MessageSquare,
  TrendingUp,
  Target,
  Clock,
  Plus,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { useApplications } from "@/shared/hooks/useApplications";
import { useAgenda } from "@/shared/hooks/useAgenda";
import { useAuth } from "@/shared/hooks/useAuth";
import { ErrorBoundary } from "@/shared/components/error/ErrorBoundary";

const CHART_CONFIG = {
  lamaran: { label: "Lamaran", color: "var(--chart-sky)" },
  wawancara: { label: "Wawancara", color: "var(--chart-violet)" },
} satisfies ChartConfig;

export function DashboardHome() {
  const { state } = useAuth();
  const { applications, isLoading: loadingApps } = useApplications();

  const stats = useMemo(() => {
    const interview = applications.filter((a) => a.status === "interview").length;
    const offer = applications.filter((a) => a.status === "offer").length;
    const applied = applications.filter((a) => a.status === "applied").length;
    const responseRate =
      applications.length === 0
        ? 0
        : Math.round(
            (applications.filter((a) => a.status !== "applied").length /
              applications.length) *
              100
          );
    return {
      total: applications.length,
      interview,
      offer,
      applied,
      responseRate,
    };
  }, [applications]);

  const chartData = useMemo(() => {
    // Group applications per ISO week label (8 minggu terakhir)
    const weeks: { name: string; lamaran: number; wawancara: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      weeks.push({
        name: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
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
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Halo, {firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ini ringkasan progres karir Anda minggu ini.
        </p>
      </header>

      {/* Section cards */}
      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
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
          sub={stats.interview > 0 ? "Siapkan jawaban STAR" : "Belum ada wawancara"}
          tone="violet"
        />
        <StatCard
          icon={Target}
          label="Tawaran Diterima"
          value={loadingApps ? "—" : stats.offer}
          sub={stats.offer > 0 ? "Selamat!" : "Terus semangat"}
          tone="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Tingkat Respons"
          value={loadingApps ? "—" : `${stats.responseRate}%`}
          sub={
            stats.responseRate >= 50
              ? "Di atas rata-rata"
              : "Tingkatkan kualitas CV"
          }
          tone="amber"
        />
      </section>

      {/* Chart + Quick actions */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Tren Lamaran 8 Minggu</CardTitle>
            <CardDescription>
              Volume lamaran mingguan dan yang dipanggil wawancara.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={CHART_CONFIG} className="aspect-auto h-[260px] w-full">
              <AreaChart data={chartData} margin={{ top: 8, left: 0, right: 8 }}>
                <defs>
                  <linearGradient id="fill-lamaran" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-lamaran)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="var(--color-lamaran)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fill-wawancara" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-wawancara)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="var(--color-wawancara)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={11}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="lamaran"
                  type="monotone"
                  stroke="var(--color-lamaran)"
                  fill="url(#fill-lamaran)"
                  stackId="a"
                />
                <Area
                  dataKey="wawancara"
                  type="monotone"
                  stroke="var(--color-wawancara)"
                  fill="url(#fill-wawancara)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Lompat ke tugas utama</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild className="justify-between">
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

      {/* Upcoming agenda — terbungkus ErrorBoundary supaya kalau
          query Convex (calendar) belum di-deploy, dashboard tetap render. */}
      <ErrorBoundary title="Agenda Terdekat tidak tersedia">
        <AgendaSection />
      </ErrorBoundary>
    </div>
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
                    {new Date(it.date).toLocaleDateString("id-ID", {
                      month: "short",
                    })}
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

type Tone = "sky" | "violet" | "green" | "amber";
const TONE_CLS: Record<Tone, string> = {
  sky: "text-info bg-info/20 dark:bg-info/20 dark:text-brand/80",
  violet: "text-brand bg-accent dark:bg-accent dark:text-brand/80",
  green: "text-success bg-success/20 dark:bg-success/20 dark:text-success/80",
  amber: "text-warning bg-warning/20 dark:bg-warning/20 dark:text-warning/80",
};

interface StatCardProps {
  icon: typeof Briefcase;
  label: string;
  value: number | string;
  sub: string;
  tone: Tone;
}

function StatCard({ icon: Icon, label, value, sub, tone }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2 flex-row justify-between items-start space-y-0">
        <div>
          <CardDescription className="text-xs">{label}</CardDescription>
          <CardTitle className="text-3xl font-bold mt-1 tabular-nums">{value}</CardTitle>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${TONE_CLS[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
