"use client";

import { useMemo, useState } from "react";
import {
  Plus, Briefcase, TrendingUp, Target, MessageSquare,
} from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { QuickFillButton } from "@/shared/components/onboarding";
import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
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
import { useApplications } from "../hooks/useApplications";
import type { Application, ApplicationStatus } from "../types";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { DataTable } from "@/shared/components/data-table";
import { STATUS_META } from "../constants/status";
import { StatCard } from "./career-dashboard/StatCard";
import { AddApplicationDialog } from "./career-dashboard/AddApplicationDialog";
import {
  APPLICATION_FILTERS,
  buildApplicationColumns,
} from "./career-dashboard/columns";

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

  // Errors come from the hook (withMutationToast). Success notify is
  // skipped on throw because `await` rethrows here.
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

  const columns = useMemo(
    () =>
      buildApplicationColumns({
        onStatusChange: (a, s) => void handleStatusChange(a, s),
        onDelete: (a) => setDeleteCandidate(a),
      }),
    // handleStatusChange identity is fine to omit — closure captures fresh ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
            filters={APPLICATION_FILTERS}
            rowKey={(a) => a.id}
            searchAccessor={(a) => `${a.company} ${a.position} ${a.notes ?? ""}`}
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
