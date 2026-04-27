"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Briefcase,
  TrendingUp,
  Target,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { QuickFillButton } from "@/shared/components/onboarding";
import { formatDate } from "@/shared/lib/formatDate";
import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import {
  ResponsiveDropdownMenu as DropdownMenu,
  ResponsiveDropdownMenuContent as DropdownMenuContent,
  ResponsiveDropdownMenuLabel as DropdownMenuLabel,
  ResponsiveDropdownMenuSeparator as DropdownMenuSeparator,
  ResponsiveDropdownMenuRadioGroup as DropdownMenuRadioGroup,
  ResponsiveDropdownMenuRadioItem as DropdownMenuRadioItem,
  ResponsiveDropdownMenuTrigger as DropdownMenuTrigger,
  ResponsiveDropdownMenuItem as DropdownMenuItem,
} from "@/shared/components/ui/responsive-dropdown-menu";
import {
  ResponsiveAlertDialog as AlertDialog,
  ResponsiveAlertDialogAction as AlertDialogAction,
  ResponsiveAlertDialogCancel as AlertDialogCancel,
  ResponsiveAlertDialogContent as AlertDialogContent,
  ResponsiveAlertDialogDescription as AlertDialogDescription,
  ResponsiveAlertDialogFooter as AlertDialogFooter,
  ResponsiveAlertDialogHeader as AlertDialogHeader,
  ResponsiveAlertDialogTitle as AlertDialogTitle,
} from "@/shared/components/ui/responsive-alert-dialog";
import { notify } from "@/shared/lib/notify";
import { cn } from "@/shared/lib/utils";
import { useApplications } from "../hooks/useApplications";
import type { Application, ApplicationStatus } from "../types";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { DataTable } from "@/shared/components/data-table";
import type { ColumnDef, FilterDef } from "@/shared/components/data-table";

const STATUS_META: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  applied: { label: "Dilamar", className: "bg-info/20 text-info dark:bg-info/20 dark:text-brand/80" },
  screening: { label: "Screening", className: "bg-warning/20 text-warning dark:bg-warning/20 dark:text-warning/80" },
  interview: { label: "Wawancara", className: "bg-accent text-brand dark:bg-accent dark:text-brand/80" },
  offer: { label: "Tawaran", className: "bg-success/20 text-success dark:bg-success/20 dark:text-success/80" },
  rejected: { label: "Ditolak", className: "bg-destructive/20 text-destructive dark:bg-destructive/20 dark:text-destructive/80" },
  withdrawn: { label: "Ditarik", className: "bg-muted text-foreground dark:bg-muted dark:text-foreground" },
};

// `formatDate` from shared/lib already produces "23 Apr 2026" with the
// id-ID locale. Kept this thin alias for readability where the call
// site says "appliedDate" — saves an inline cast at every cell.
const formatAppliedDate = formatDate;

export function CareerDashboard() {
  const { applications, isLoading, create, updateStatus, remove } =
    useApplications();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Application | null>(
    null,
  );

  const stats = useMemo(() => {
    const total = applications.length;
    const applied = applications.filter((a) => a.status === "applied").length;
    const interview = applications.filter((a) => a.status === "interview").length;
    const offer = applications.filter((a) => a.status === "offer").length;
    const responseRate =
      total === 0
        ? 0
        : Math.round(
            (applications.filter((a) => a.status !== "applied").length / total) *
              100,
          );
    return { total, applied, interview, offer, responseRate };
  }, [applications]);

  // Error toasts come from `useApplications` (withMutationToast). We
  // only need to handle the success message here — and `await` will
  // throw on failure, so the success notify is correctly skipped.
  const handleStatusChange = async (
    app: Application,
    status: ApplicationStatus,
  ) => {
    try {
      await updateStatus(app.id, status);
      notify.success(`Status diubah ke ${STATUS_META[status].label}`);
    } catch {
      // Already toasted by hook.
    }
  };

  const handleDelete = async (app: Application) => {
    try {
      await remove(app.id);
      notify.success("Lamaran dihapus", {
        description: `${app.position} @ ${app.company}`,
      });
    } catch {
      // Already toasted by hook.
    } finally {
      setDeleteCandidate(null);
    }
  };

  const columns: ReadonlyArray<ColumnDef<Application>> = [
    {
      id: "company",
      header: "Perusahaan",
      accessor: (a) => a.company,
      cell: (a) => <span className="font-medium">{a.company}</span>,
    },
    {
      id: "position",
      header: "Posisi",
      accessor: (a) => a.position,
    },
    {
      id: "status",
      header: "Status",
      accessor: (a) => a.status,
      cell: (a) => {
        const meta = STATUS_META[a.status] ?? {
          label: a.status,
          className: "bg-muted text-foreground",
        };
        return (
          <Badge variant="secondary" className={meta.className}>
            {meta.label}
          </Badge>
        );
      },
    },
    {
      id: "appliedDate",
      header: "Tanggal",
      accessor: (a) => {
        const d = typeof a.appliedDate === "number"
          ? new Date(a.appliedDate)
          : new Date(a.appliedDate);
        return Number.isNaN(d.getTime()) ? null : d;
      },
      cell: (a) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatAppliedDate(a.appliedDate)}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      id: "notes",
      header: "Catatan",
      accessor: (a) => a.notes ?? "",
      cell: (a) => (
        <span className="block max-w-[240px] truncate text-sm text-muted-foreground">
          {a.notes || "—"}
        </span>
      ),
      hideOnMobile: true,
      sortable: false,
    },
    {
      id: "actions",
      header: "",
      accessor: () => "",
      sortable: false,
      hideMobileLabel: true,
      cell: (a) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Aksi untuk ${a.company}`}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ubah Status</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={a.status}
              onValueChange={(v) =>
                void handleStatusChange(a, v as ApplicationStatus)
              }
            >
              {(Object.keys(STATUS_META) as ApplicationStatus[]).map((s) => (
                <DropdownMenuRadioItem key={s} value={s}>
                  {STATUS_META[s].label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setDeleteCandidate(a)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus Lamaran
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters: ReadonlyArray<FilterDef<Application>> = [
    {
      id: "status",
      label: "Status",
      accessor: (a) => a.status,
      options: (Object.keys(STATUS_META) as ApplicationStatus[]).map((s) => ({
        value: s,
        label: STATUS_META[s].label,
      })),
    },
  ];

  return (
    <PageContainer size="xl" className="flex flex-col gap-6">
      <ResponsivePageHeader
        title="Lamaran"
        description="Pantau semua lamaran yang sudah Anda kirim."
        actions={
          <>
            <QuickFillButton variant="outline" size="sm" />
            <Button
              onClick={() => setAddOpen(true)}
              className="bg-brand hover:bg-brand"
              aria-label="Tambah lamaran baru"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Lamaran
            </Button>
          </>
        }
      />

      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Ringkasan lamaran"
      >
        <StatCard
          icon={Briefcase}
          label="Total Lamaran"
          value={stats.total}
          tone="sky"
          sub={
            stats.applied > 0
              ? `${stats.applied} masih diproses`
              : "Mulai melamar"
          }
        />
        <StatCard
          icon={MessageSquare}
          label="Wawancara"
          value={stats.interview}
          tone="violet"
          sub={
            stats.interview > 0 ? "Terus persiapan" : "Belum ada wawancara"
          }
        />
        <StatCard
          icon={Target}
          label="Tawaran Diterima"
          value={stats.offer}
          tone="emerald"
          sub={stats.offer > 0 ? "Selamat!" : "Terus semangat"}
        />
        <StatCard
          icon={TrendingUp}
          label="Tingkat Respons"
          value={`${stats.responseRate}%`}
          tone="amber"
          sub={
            stats.responseRate >= 30 ? "Bagus" : "Tingkatkan kualitas CV"
          }
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Lamaran</CardTitle>
          <CardDescription>
            Cari, sortir, filter status, kelola lamaran Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<Application>
            data={applications}
            columns={columns}
            filters={filters}
            rowKey={(a) => a.id}
            searchAccessor={(a) =>
              `${a.company} ${a.position} ${a.notes ?? ""}`
            }
            searchPlaceholder="Cari perusahaan, posisi, catatan…"
            isLoading={isLoading}
            emptyMessage={
              <div className="space-y-3">
                <p>Belum ada lamaran. Tambah lamaran pertama Anda!</p>
                <Button
                  onClick={() => setAddOpen(true)}
                  size="sm"
                  className="bg-brand hover:bg-brand"
                >
                  <Plus className="mr-1 h-4 w-4" /> Tambah Lamaran
                </Button>
              </div>
            }
          />
        </CardContent>
      </Card>

      <AddApplicationDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreate={async (payload) => {
          try {
            await create(payload);
            notify.success("Lamaran ditambahkan", {
              description: `${payload.position} @ ${payload.company}`,
            });
            setAddOpen(false);
          } catch {
            // Already toasted by hook.
          }
        }}
      />

      <AlertDialog
        open={deleteCandidate !== null}
        onOpenChange={(o) => !o && setDeleteCandidate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus lamaran ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCandidate && (
                <>
                  <strong>{deleteCandidate.position}</strong> @{" "}
                  {deleteCandidate.company} akan dihapus permanen.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                if (deleteCandidate) void handleDelete(deleteCandidate);
              }}
            >
              Ya, hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

type Tone = "sky" | "violet" | "emerald" | "amber";
const TONE_CLS: Record<Tone, string> = {
  sky: "text-info bg-info/20 dark:bg-info/20 dark:text-brand/80",
  violet: "text-brand bg-accent dark:bg-accent dark:text-brand/80",
  emerald:
    "text-success bg-success/20 dark:bg-success/20 dark:text-success/80",
  amber: "text-warning bg-warning/20 dark:bg-warning/20 dark:text-warning/80",
};

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  sub,
}: {
  icon: typeof Briefcase;
  label: string;
  value: number | string;
  tone: Tone;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardDescription className="text-xs">{label}</CardDescription>
          <CardTitle className="mt-1 text-3xl font-bold tabular-nums">
            {value}
          </CardTitle>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            TONE_CLS[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      {sub && (
        <CardContent className="flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowUpRight className="h-3 w-3" /> {sub}
        </CardContent>
      )}
    </Card>
  );
}

interface AddApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: {
    company: string;
    position: string;
    location?: string;
    salary?: string;
    notes?: string;
    source?: string;
  }) => Promise<void>;
}

function AddApplicationDialog({
  open,
  onOpenChange,
  onCreate,
}: AddApplicationDialogProps) {
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setCompany("");
    setPosition("");
    setLocation("");
    setSalary("");
    setSource("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !position.trim()) return;
    setSubmitting(true);
    try {
      await onCreate({
        company: company.trim(),
        position: position.trim(),
        location: location.trim() || undefined,
        salary: salary.trim() || undefined,
        source: source.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Lamaran Baru</DialogTitle>
          <DialogDescription>
            Catat detail lamaran agar mudah ditelusuri saat follow-up.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="app-company">Nama Perusahaan *</Label>
              <Input
                id="app-company"
                placeholder="cth. Tokopedia"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-position">Posisi *</Label>
              <Input
                id="app-position"
                placeholder="cth. Software Engineer"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="app-location">Lokasi</Label>
              <Input
                id="app-location"
                placeholder="cth. Jakarta / Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-salary">Ekspektasi Gaji</Label>
              <Input
                id="app-salary"
                placeholder="cth. Rp 12–18 juta"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-source">Sumber Lowongan</Label>
            <ResponsiveSelect
              value={source ?? ""}
              onValueChange={setSource}
            >
              <ResponsiveSelectTrigger id="app-source" placeholder="Pilih sumber" />
              <ResponsiveSelectContent drawerTitle="Sumber lowongan">
                <ResponsiveSelectItem value="Website perusahaan">
                  Website perusahaan
                </ResponsiveSelectItem>
                <ResponsiveSelectItem value="LinkedIn">LinkedIn</ResponsiveSelectItem>
                <ResponsiveSelectItem value="JobStreet">JobStreet</ResponsiveSelectItem>
                <ResponsiveSelectItem value="Glints">Glints</ResponsiveSelectItem>
                <ResponsiveSelectItem value="Referensi">
                  Referensi teman / mentor
                </ResponsiveSelectItem>
                <ResponsiveSelectItem value="Kalibrr">Kalibrr</ResponsiveSelectItem>
                <ResponsiveSelectItem value="Lainnya">Lainnya</ResponsiveSelectItem>
              </ResponsiveSelectContent>
            </ResponsiveSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-notes">Catatan</Label>
            <Textarea
              id="app-notes"
              placeholder="cth. referensi dari Pak Andi, deadline 30 April"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-brand hover:bg-brand"
            >
              {submitting ? "Menyimpan…" : "Tambah Lamaran"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
