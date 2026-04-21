"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  Filter,
  Briefcase,
  TrendingUp,
  Target,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
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
  ResponsiveDropdownMenuItem as DropdownMenuItem,
  ResponsiveDropdownMenuLabel as DropdownMenuLabel,
  ResponsiveDropdownMenuSeparator as DropdownMenuSeparator,
  ResponsiveDropdownMenuRadioGroup as DropdownMenuRadioGroup,
  ResponsiveDropdownMenuRadioItem as DropdownMenuRadioItem,
  ResponsiveDropdownMenuTrigger as DropdownMenuTrigger,
} from "@/shared/components/ui/responsive-dropdown-menu";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  ResponsiveAlertDialog as AlertDialog,
  ResponsiveAlertDialogAction as AlertDialogAction,
  ResponsiveAlertDialogCancel as AlertDialogCancel,
  ResponsiveAlertDialogContent as AlertDialogContent,
  ResponsiveAlertDialogDescription as AlertDialogDescription,
  ResponsiveAlertDialogFooter as AlertDialogFooter,
  ResponsiveAlertDialogHeader as AlertDialogHeader,
  ResponsiveAlertDialogTitle as AlertDialogTitle,
  ResponsiveAlertDialogTrigger as AlertDialogTrigger,
} from "@/shared/components/ui/responsive-alert-dialog";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { useApplications } from "../hooks/useApplications";
import type { Application, ApplicationStatus } from "../types";

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

const STATUS_FILTER_OPTIONS: Array<{ value: ApplicationStatus | "all"; label: string }> = [
  { value: "all", label: "Semua Status" },
  { value: "applied", label: "Dilamar" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Wawancara" },
  { value: "offer", label: "Tawaran" },
  { value: "rejected", label: "Ditolak" },
  { value: "withdrawn", label: "Ditarik" },
];

export function CareerDashboard() {
  const { applications, isLoading, create, updateStatus, remove } = useApplications();
  const [addOpen, setAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");

  const stats = useMemo(() => {
    const total = applications.length;
    const applied = applications.filter((a) => a.status === "applied").length;
    const interview = applications.filter((a) => a.status === "interview").length;
    const offer = applications.filter((a) => a.status === "offer").length;
    const responseRate =
      total === 0
        ? 0
        : Math.round(
            (applications.filter((a) => a.status !== "applied").length / total) * 100
          );
    return { total, applied, interview, offer, responseRate };
  }, [applications]);

  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return applications.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (!q) return true;
      return (
        app.company.toLowerCase().includes(q) ||
        app.position.toLowerCase().includes(q) ||
        (app.notes ?? "").toLowerCase().includes(q)
      );
    });
  }, [applications, searchQuery, statusFilter]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <ResponsivePageHeader
        title="Lamaran"
        description="Pantau semua lamaran yang sudah Anda kirim."
        actions={
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-brand hover:bg-brand"
            aria-label="Tambah lamaran baru"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Lamaran
          </Button>
        }
      />

      {/* Stat cards */}
      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Ringkasan lamaran"
      >
        <StatCard
          icon={Briefcase}
          label="Total Lamaran"
          value={stats.total}
          tone="sky"
          sub={stats.applied > 0 ? `${stats.applied} masih diproses` : "Mulai melamar"}
        />
        <StatCard
          icon={MessageSquare}
          label="Wawancara"
          value={stats.interview}
          tone="violet"
          sub={stats.interview > 0 ? "Terus persiapan" : "Belum ada wawancara"}
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
          sub={stats.responseRate >= 30 ? "Bagus" : "Tingkatkan kualitas CV"}
        />
      </section>

      {/* Data table */}
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Daftar Lamaran</CardTitle>
              <CardDescription>
                {filteredApps.length} dari {applications.length} lamaran
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                type="search"
                placeholder="Cari perusahaan, posisi…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-[240px]"
                aria-label="Cari lamaran"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Filter status">
                    <Filter className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as ApplicationStatus | "all")}
                  >
                    {STATUS_FILTER_OPTIONS.map((opt) => (
                      <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {applications.length === 0
                  ? "Belum ada lamaran. Tambah lamaran pertama Anda!"
                  : "Tidak ada lamaran yang cocok dengan filter."}
              </p>
              {applications.length === 0 && (
                <Button
                  onClick={() => setAddOpen(true)}
                  size="sm"
                  className="mt-3 bg-brand hover:bg-brand"
                >
                  <Plus className="w-4 h-4 mr-1" /> Tambah Lamaran
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Perusahaan</TableHead>
                    <TableHead>Posisi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                    <TableHead className="hidden lg:table-cell">Catatan</TableHead>
                    <TableHead className="w-10">
                      <span className="sr-only">Aksi</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app) => (
                    <ApplicationRow
                      key={app.id}
                      app={app}
                      onStatusChange={async (status) => {
                        try {
                          await updateStatus(app.id, status);
                          toast.success(`Status diubah ke ${STATUS_META[status].label}`);
                        } catch (err) {
                          toast.error("Gagal mengubah status", {
                            description: err instanceof Error ? err.message : undefined,
                          });
                        }
                      }}
                      onDelete={async () => {
                        try {
                          await remove(app.id);
                          toast.success("Lamaran dihapus", {
                            description: `${app.position} @ ${app.company}`,
                          });
                        } catch (err) {
                          toast.error("Gagal menghapus", {
                            description: err instanceof Error ? err.message : undefined,
                          });
                        }
                      }}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddApplicationDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreate={async (payload) => {
          try {
            await create(payload);
            toast.success("Lamaran ditambahkan", {
              description: `${payload.position} @ ${payload.company}`,
            });
            setAddOpen(false);
          } catch (err) {
            toast.error("Gagal menambahkan lamaran", {
              description: err instanceof Error ? err.message : undefined,
            });
          }
        }}
      />
    </div>
  );
}

type Tone = "sky" | "violet" | "emerald" | "amber";
const TONE_CLS: Record<Tone, string> = {
  sky: "text-info bg-info/20 dark:bg-info/20 dark:text-brand/80",
  violet: "text-brand bg-accent dark:bg-accent dark:text-brand/80",
  emerald: "text-success bg-success/20 dark:bg-success/20 dark:text-success/80",
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
      <CardHeader className="pb-2 flex-row justify-between items-start space-y-0">
        <div>
          <CardDescription className="text-xs">{label}</CardDescription>
          <CardTitle className="text-3xl font-bold mt-1 tabular-nums">{value}</CardTitle>
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", TONE_CLS[tone])}>
          <Icon className="w-5 h-5" />
        </div>
      </CardHeader>
      {sub && (
        <CardContent className="flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowUpRight className="w-3 h-3" /> {sub}
        </CardContent>
      )}
    </Card>
  );
}

interface ApplicationRowProps {
  app: Application;
  onStatusChange: (status: ApplicationStatus) => void;
  onDelete: () => void;
}

function ApplicationRow({ app, onStatusChange, onDelete }: ApplicationRowProps) {
  const meta = STATUS_META[app.status];
  return (
    <TableRow>
      <TableCell className="font-medium">{app.company}</TableCell>
      <TableCell>{app.position}</TableCell>
      <TableCell>
        <Badge variant="secondary" className={meta.className}>
          {meta.label}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell text-muted-foreground text-sm tabular-nums">
        {app.appliedDate}
      </TableCell>
      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm max-w-[240px] truncate">
        {app.notes || "—"}
      </TableCell>
      <TableCell className="text-right">
        <RowActions app={app} onStatusChange={onStatusChange} onDelete={onDelete} />
      </TableCell>
    </TableRow>
  );
}

function RowActions({ app, onStatusChange, onDelete }: ApplicationRowProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Aksi untuk ${app.company}`}>
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ubah Status</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={app.status}
          onValueChange={(v) => onStatusChange(v as ApplicationStatus)}
        >
          {(Object.keys(STATUS_META) as ApplicationStatus[]).map((s) => (
            <DropdownMenuRadioItem key={s} value={s}>
              {STATUS_META[s].label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        {app.notes && (
          <DropdownMenuItem disabled>
            <ExternalLink className="w-4 h-4 mr-2" /> Lihat catatan
          </DropdownMenuItem>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(e) => e.preventDefault()}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Hapus Lamaran
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus lamaran ini?</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>{app.position}</strong> @ {app.company} akan dihapus permanen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Ya, hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
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

function AddApplicationDialog({ open, onOpenChange, onCreate }: AddApplicationDialogProps) {
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Lamaran Baru</DialogTitle>
          <DialogDescription>
            Catat detail lamaran agar mudah ditelusuri saat follow-up.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
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

          <div className="grid sm:grid-cols-2 gap-3">
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
            <Select value={source || undefined} onValueChange={setSource}>
              <SelectTrigger id="app-source">
                <SelectValue placeholder="Pilih sumber" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Website perusahaan">Website perusahaan</SelectItem>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                <SelectItem value="JobStreet">JobStreet</SelectItem>
                <SelectItem value="Glints">Glints</SelectItem>
                <SelectItem value="Referensi">Referensi teman / mentor</SelectItem>
                <SelectItem value="Kalibrr">Kalibrr</SelectItem>
                <SelectItem value="Lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
