"use client";

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Users as UsersIcon,
  TrendingUp,
  FileText,
  Target,
  MapPin,
  GraduationCap,
  Sparkles,
  ListChecks,
  ScrollText,
  AlertTriangle,
  MessageSquare,
  Activity,
  Database,
  Globe,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { CodeBlock } from "@/shared/components/ui/copy-button";
import { LoadingScreen } from "@/shared/components/feedback/LoadingScreen";
import { ErrorBoundary } from "@/shared/components/error/ErrorBoundary";
import { api } from "../../../../convex/_generated/api";
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { StatCard } from '@/shared/components/stats/StatCard';
import { formatFileSize as formatBytes } from "@/shared/lib/formatFileSize";

/**
 * Tab panels are lazy-loaded so the initial admin bundle stays small —
 * each tab fetches its own chunk only when the user activates it.
 * `ssr: false` because every panel uses Convex `useQuery` which runs
 * client-only.
 */
const PanelSkeleton = () => (
  <div className="space-y-3 rounded-md border border-border p-4" aria-busy="true">
    <Skeleton className="h-6 w-48" />
    <Skeleton className="h-4 w-72" />
    <div className="space-y-2 pt-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);
const UsersTable = dynamic(() => import("./UsersTable").then((m) => m.UsersTable), {
  ssr: false, loading: PanelSkeleton,
});
const RoadmapPanel = dynamic(() => import("./RoadmapPanel").then((m) => m.RoadmapPanel), {
  ssr: false, loading: PanelSkeleton,
});
const TemplatePanel = dynamic(() => import("./TemplatePanel").then((m) => m.TemplatePanel), {
  ssr: false, loading: PanelSkeleton,
});
const AuditLogPanel = dynamic(() => import("./AuditLogPanel").then((m) => m.AuditLogPanel), {
  ssr: false, loading: PanelSkeleton,
});
const FeedbackPanel = dynamic(() => import("./FeedbackPanel").then((m) => m.FeedbackPanel), {
  ssr: false, loading: PanelSkeleton,
});
const ErrorLogsPanel = dynamic(() => import("./ErrorLogsPanel").then((m) => m.ErrorLogsPanel), {
  ssr: false, loading: PanelSkeleton,
});
const AIConfigPanel = dynamic(() => import("./AIConfigPanel").then((m) => m.AIConfigPanel), {
  ssr: false, loading: PanelSkeleton,
});
const AIUsagePanel = dynamic(() => import("./AIUsagePanel").then((m) => m.AIUsagePanel), {
  ssr: false, loading: PanelSkeleton,
});
const EngineSeedPanel = dynamic(() => import("./EngineSeedPanel").then((m) => m.EngineSeedPanel), {
  ssr: false, loading: PanelSkeleton,
});
const TrafficPanel = dynamic(() => import("./TrafficPanel").then((m) => m.TrafficPanel), {
  ssr: false, loading: PanelSkeleton,
});

export function AdminPanel() {
  const router = useRouter();

  // Two-tier gating: `amIAdmin` lets role-bootstrapped admins in.
  // `amISuperAdmin` controls the analytics charts which still query
  // privileged data (full `users` table, profile aggregates).
  const amIAdmin = useQuery(api.admin.queries.amIAdmin);
  const amISuperAdmin = useQuery(api.admin.queries.amISuperAdmin);
  const overview = useQuery(
    api.admin.queries.getOverview,
    amISuperAdmin ? {} : "skip",
  );
  const profileAggs = useQuery(
    api.admin.queries.getProfileAggregates,
    amISuperAdmin ? {} : "skip",
  );
  const adoption = useQuery(
    api.admin.queries.getFeatureAdoption,
    amISuperAdmin ? {} : "skip",
  );
  const trend = useQuery(
    api.admin.queries.getSignupTrend,
    amISuperAdmin ? {} : "skip",
  );

  // Transform signup trend for the chart (short date label). Hook must
  // run unconditionally (rules-of-hooks) — safe to read `trend` when
  // undefined.
  const trendData = useMemo(
    () =>
      (trend ?? []).map((b) => ({
        ...b,
        label: b.date.slice(5), // MM-DD
      })),
    [trend],
  );

  // Client-side redirect for non-admins. Server enforces independently
  // on every query — this just keeps the URL clean for users with no
  // admin role at all.
  useEffect(() => {
    if (amIAdmin === false) router.replace("/dashboard");
  }, [amIAdmin, router]);

  if (amIAdmin === undefined || amIAdmin === false) return <LoadingScreen />;

  return (
    <PageContainer size="xl" className="min-w-0 space-y-6 overflow-x-hidden">
      <ResponsivePageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-brand" /> Admin Panel
          </span>
        }
        description={
          amISuperAdmin
            ? "Analitik semua pengguna untuk panduan keputusan produk."
            : "Kelola pengguna, role, dan akses akun."
        }
      />

      {!amISuperAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Akses terbatas</CardTitle>
            <CardDescription className="space-y-2">
              <span className="block">
                Anda login sebagai admin (peran). Analitik agregat hanya tersedia
                untuk akun super-admin — set env ini di backend untuk membuka
                panel statistik penuh:
              </span>
              {/* An env name is retyped into a server config, so it gets the
                  copy button rather than a <code> the admin has to select. */}
              <CodeBlock
                value="SUPER_ADMIN_EMAIL"
                label="Salin nama env SUPER_ADMIN_EMAIL"
                className="w-fit"
              />
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Analytics — super-admin only. `min-w-0` on the wrapper and the
       *  chart cards stops recharts' `ResponsiveContainer` (which measures
       *  its parent's box, not the viewport) from ever forcing this block
       *  wider than the page — without it a wide first paint here pushes
       *  the whole `/dashboard/admin-panel` route into horizontal scroll,
       *  clipping the sticky header's right-aligned actions along with it. */}
      {amISuperAdmin && (
        <div className="min-w-0 space-y-6">
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={UsersIcon}
          label="Total Pengguna"
          value={overview?.totalUsers ?? "—"}
          sub={overview ? `${overview.signedUp7} baru dalam 7 hari` : null}
        />
        <StatCard
          icon={TrendingUp}
          label="Profil Lengkap"
          value={overview ? `${overview.profileCompletePct}%` : "—"}
          sub={
            overview
              ? `${overview.profilesCount} profil dari ${overview.totalUsers}`
              : null
          }
        />
        <StatCard
          icon={Sparkles}
          label="Profil Publik Aktif"
          value={overview ? `${overview.publicEnabledPct}%` : "—"}
          sub={overview ? `${overview.publicEnabled} pengguna opt-in` : null}
        />
        <StatCard
          icon={FileText}
          label="Storage Terpakai"
          value={overview ? formatBytes(overview.storage.totalBytes) : "—"}
          sub={
            overview
              ? `${overview.storage.imageCount} gambar · ${overview.storage.pdfCount} PDF`
              : null
          }
        />
      </div>

      {/* Signup trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tren Pendaftaran (30 hari)</CardTitle>
          <CardDescription>
            Jumlah akun baru per hari. Lonjakan tajam bisa berarti kampanye
            atau efek referral.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trendData.length > 0 ? (
            <div className="h-48 min-w-0 overflow-x-auto">
              <ResponsiveContainer>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
                  <XAxis
                    dataKey="label"
                    stroke="oklch(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke="oklch(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(var(--card))",
                      border: "1px solid oklch(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "oklch(var(--foreground))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="oklch(var(--brand))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Memuat…</p>
          )}
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <TopList
          icon={Target}
          title="Top Target Role"
          description="Role karir paling dicari pengguna. Jika satu role dominan (mis. 'guru'), pertimbangkan roadmap khusus."
          items={profileAggs?.topTargetRoles ?? []}
          emptyLabel="Belum ada data target role."
        />
        <TopList
          icon={MapPin}
          title="Top Lokasi"
          description="Kota asal pengguna. Event / kemitraan lokal bisa di-target ke kota teratas."
          items={profileAggs?.topLocations ?? []}
          emptyLabel="Belum ada data lokasi."
        />
        <TopList
          icon={GraduationCap}
          title="Level Pengalaman"
          description="Distribusi pengalaman. Entry/mid dominan → konten onboarding. Senior → topik lanjutan."
          items={profileAggs?.topExperience ?? []}
          emptyLabel="Belum ada data level pengalaman."
        />
        <TopList
          icon={Sparkles}
          title="Top Keterampilan"
          description="Skill yang paling sering dicantumkan. Jika banyak 'public speaking', mungkin tambahkan simulasi bicara publik."
          items={profileAggs?.topSkills ?? []}
          emptyLabel="Belum ada data keterampilan."
        />
      </div>

      {/* Feature adoption */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Adopsi Fitur</CardTitle>
          <CardDescription>
            Persentase pengguna yang sudah menyentuh setiap slice. Rendah = perlu
            onboarding / tutorial; tinggi = kandidat untuk diperdalam.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adoption?.adoption ? (
            <div className="h-72 min-w-0 overflow-x-auto">
              <ResponsiveContainer>
                <BarChart
                  data={adoption.adoption}
                  layout="vertical"
                  margin={{ top: 0, right: 16, bottom: 0, left: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
                  <XAxis
                    type="number"
                    stroke="oklch(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="slice"
                    stroke="oklch(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                    width={140}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(var(--card))",
                      border: "1px solid oklch(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="pct"
                    fill="oklch(var(--brand))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Memuat…</p>
          )}
        </CardContent>
      </Card>

        </div>
      )}{/* end super-admin analytics block */}

      {/* Bottom panels — tabbed so the admin page stops being a 6-section
       *  vertical scroll. Server still gates each query with
       *  `requireAdmin`; client tabs are pure UX. */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList variant="pills">
          <TabsTrigger value="users">
            <UsersIcon className="w-3.5 h-3.5" />
            Pengguna
          </TabsTrigger>
          <TabsTrigger value="templates">
            <GraduationCap className="w-3.5 h-3.5" />
            Template
          </TabsTrigger>
          <TabsTrigger value="roadmaps">
            <ListChecks className="w-3.5 h-3.5" />
            Roadmap Pengguna
          </TabsTrigger>
          <TabsTrigger value="audit">
            <ScrollText className="w-3.5 h-3.5" />
            Audit
          </TabsTrigger>
          <TabsTrigger value="feedback">
            <MessageSquare className="w-3.5 h-3.5" />
            Masukan
          </TabsTrigger>
          <TabsTrigger value="errors">
            <AlertTriangle className="w-3.5 h-3.5" />
            Kesalahan
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="w-3.5 h-3.5" />
            AI
          </TabsTrigger>
          <TabsTrigger value="ai-usage">
            <Activity className="w-3.5 h-3.5" />
            Penggunaan AI
          </TabsTrigger>
          <TabsTrigger value="traffic">
            <Globe className="w-3.5 h-3.5" />
            Trafik
          </TabsTrigger>
          <TabsTrigger value="engine-seed">
            <Database className="w-3.5 h-3.5" />
            Engine Seed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <ErrorBoundary title="Tabel pengguna gagal dimuat"><UsersTable /></ErrorBoundary>
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
          <ErrorBoundary title="Panel template gagal dimuat"><TemplatePanel /></ErrorBoundary>
        </TabsContent>
        <TabsContent value="roadmaps" className="mt-4">
          <ErrorBoundary title="Panel roadmap gagal dimuat"><RoadmapPanel /></ErrorBoundary>
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <ErrorBoundary title="Log audit gagal dimuat"><AuditLogPanel /></ErrorBoundary>
        </TabsContent>
        <TabsContent value="feedback" className="mt-4">
          <ErrorBoundary title="Masukan gagal dimuat"><FeedbackPanel /></ErrorBoundary>
        </TabsContent>
        <TabsContent value="errors" className="mt-4">
          <ErrorBoundary title="Log kesalahan gagal dimuat"><ErrorLogsPanel /></ErrorBoundary>
        </TabsContent>
        <TabsContent value="ai" className="mt-4">
          <ErrorBoundary title="Panel AI gagal dimuat"><AIConfigPanel /></ErrorBoundary>
        </TabsContent>
        <TabsContent value="ai-usage" className="mt-4">
          <ErrorBoundary title="Panel Penggunaan AI gagal dimuat"><AIUsagePanel /></ErrorBoundary>
        </TabsContent>
        <TabsContent value="traffic" className="mt-4">
          <ErrorBoundary title="Panel Trafik gagal dimuat"><TrafficPanel /></ErrorBoundary>
        </TabsContent>
        <TabsContent value="engine-seed" className="mt-4">
          <ErrorBoundary title="Panel Engine Seed gagal dimuat"><EngineSeedPanel /></ErrorBoundary>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

// KpiCard consolidated into shared StatCard. API mapping: `hint` → `sub`.
// Import added at the top of this file; usages below already swapped.

interface TopListProps {
  icon: React.ElementType;
  title: string;
  description: string;
  items: Array<{ value: string; count: number }>;
  emptyLabel: string;
}

function TopList({ icon: Icon, title, description, items, emptyLabel }: TopListProps) {
  const max = items[0]?.count ?? 1;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="w-4 h-4 text-brand" />
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul className="space-y-2">
            {items.slice(0, 10).map((item, idx) => (
              <li key={`${item.value}-${idx}`} className="space-y-0.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate capitalize">{item.value}</span>
                  <span className="tabular-nums text-xs text-muted-foreground flex-shrink-0">
                    {item.count}×
                  </span>
                </div>
                <Progress value={(item.count / max) * 100} className="h-1.5" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

