"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  Shield,
  Trash2,
  UserMinus,
  UserCog,
} from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { notify } from "@/shared/lib/notify";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@/shared/components/ui/responsive-alert-dialog";
import { formatDate } from "@/shared/lib/formatDate";
import { cn } from "@/shared/lib/utils";
import { DataTable } from "@/shared/components/data-table";
import type { ColumnDef, FilterDef } from "@/shared/components/data-table";

type Role = "admin" | "moderator" | "user";

type RowData = NonNullable<
  ReturnType<typeof useQuery<typeof api.admin.queries.listUsersWithProfiles>>
>[number];

const ROLE_BADGE: Record<Role, string> = {
  admin: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  moderator: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  user: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

const NEXT_ROLE: Record<Role, Role> = {
  user: "moderator",
  moderator: "admin",
  admin: "user",
};

/**
 * Super-admin users table — search, sort, filter, multi-select with
 * bulk role-change + bulk delete. Built on the shared `<DataTable>`
 * primitive so behaviour stays in lock-step with the Database hub
 * tabs (selection model, mobile card fallback, sort indicators).
 */
export function UsersTable() {
  const users = useQuery(api.admin.queries.listUsersWithProfiles);
  const updateRole = useMutation(api.admin.mutations.updateUserRole);
  const deleteOne = useMutation(api.admin.mutations.deleteUser);
  const bulkDelete = useMutation(api.admin.mutations.bulkDeleteUsers);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<Id<"users"> | null>(null);
  const [confirm, setConfirm] = useState<
    | { kind: "delete-one"; userId: Id<"users">; label: string }
    | { kind: "delete-bulk"; ids: Id<"users">[] }
    | null
  >(null);
  const [busy, setBusy] = useState(false);

  const handleRoleChange = async (userId: Id<"users">, role: Role) => {
    setPendingId(userId);
    try {
      await updateRole({ userId, role });
      notify.success(`Role diubah ke ${role}`);
    } catch (err) {
      notify.fromError(err, "Gagal mengubah role");
    } finally {
      setPendingId(null);
    }
  };

  const handleDeleteOne = async (userId: Id<"users">) => {
    setBusy(true);
    try {
      await deleteOne({ userId });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      notify.success("Pengguna dihapus");
    } catch (err) {
      notify.fromError(err, "Gagal menghapus");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const handleBulkDelete = async (ids: Id<"users">[]) => {
    setBusy(true);
    try {
      const res = await bulkDelete({ userIds: ids });
      setSelectedIds(new Set());
      notify.success(`${res.deleted} pengguna dihapus`);
    } catch (err) {
      notify.fromError(err, "Gagal menghapus massal");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const columns: ReadonlyArray<ColumnDef<RowData>> = [
    {
      id: "email",
      header: "Email",
      accessor: (r) => r.email ?? "",
      cell: (r) =>
        r.email ? (
          <span className="font-mono text-xs">{r.email}</span>
        ) : (
          <span className="italic text-muted-foreground">(anonim)</span>
        ),
    },
    {
      id: "fullName",
      header: "Nama",
      accessor: (r) => r.fullName || r.name || "",
      cell: (r) => r.fullName || r.name || "—",
    },
    {
      id: "targetRole",
      header: "Target Role",
      accessor: (r) => r.targetRole || "",
      cell: (r) => r.targetRole || "—",
      hideOnMobile: true,
    },
    {
      id: "location",
      header: "Lokasi",
      accessor: (r) => r.location || "",
      cell: (r) => r.location || "—",
      hideOnMobile: true,
    },
    {
      id: "experienceLevel",
      header: "Level",
      accessor: (r) => r.experienceLevel || "",
      cell: (r) => r.experienceLevel || "—",
      hideOnMobile: true,
    },
    {
      id: "role",
      header: "Role",
      accessor: (r) => r.role,
      cell: (r) => (
        <Badge
          className={cn(
            "border-transparent text-[10px]",
            ROLE_BADGE[r.role as Role] ?? ROLE_BADGE.user,
          )}
        >
          {r.role}
        </Badge>
      ),
    },
    {
      id: "skillsCount",
      header: "Skills",
      accessor: (r) => r.skillsCount,
      align: "right",
      hideOnMobile: true,
    },
    {
      id: "createdAt",
      header: "Daftar",
      accessor: (r) => r.createdAt,
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(r.createdAt)}
        </span>
      ),
      align: "right",
    },
    {
      id: "actions",
      header: "",
      accessor: () => "",
      sortable: false,
      hideMobileLabel: true,
      cell: (r) => {
        const isPending = pendingId === r.userId;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={isPending || busy}
                aria-label="Aksi pengguna"
                onClick={(e) => e.stopPropagation()}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs">
                {r.email || "Pengguna anonim"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() =>
                  handleRoleChange(r.userId, NEXT_ROLE[r.role as Role])
                }
              >
                <UserCog className="mr-2 h-4 w-4" />
                Set role: {NEXT_ROLE[r.role as Role]}
              </DropdownMenuItem>
              {(r.role as Role) !== "admin" && (
                <DropdownMenuItem
                  onSelect={() => handleRoleChange(r.userId, "admin")}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Jadikan admin
                </DropdownMenuItem>
              )}
              {(r.role as Role) !== "user" && (
                <DropdownMenuItem
                  onSelect={() => handleRoleChange(r.userId, "user")}
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  Turunkan ke user
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() =>
                  setConfirm({
                    kind: "delete-one",
                    userId: r.userId,
                    label: r.email || r.fullName || "pengguna ini",
                  })
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus akun
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const filters: ReadonlyArray<FilterDef<RowData>> = [
    {
      id: "role",
      label: "Role",
      accessor: (r) => r.role,
      options: [
        { value: "admin", label: "Admin" },
        { value: "moderator", label: "Moderator" },
        { value: "user", label: "User" },
      ],
    },
    {
      id: "account",
      label: "Tipe akun",
      accessor: (r) => (r.email ? "real" : "anonymous"),
      options: [
        { value: "real", label: "Akun terdaftar" },
        { value: "anonymous", label: "Demo / Anonim" },
      ],
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Pengguna</CardTitle>
        <CardDescription>
          200 pengguna terbaru. Cari, sortir, filter, pilih banyak baris untuk
          aksi massal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable<RowData>
          data={users ?? []}
          columns={columns}
          filters={filters}
          rowKey={(r) => r.userId}
          searchAccessor={(r) =>
            [
              r.email,
              r.name,
              r.fullName,
              r.targetRole,
              r.location,
              r.experienceLevel,
            ]
              .filter(Boolean)
              .join(" ")
          }
          searchPlaceholder="Cari email, nama, target role, lokasi…"
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          isLoading={users === undefined}
          emptyMessage="Belum ada pengguna."
          bulkActions={
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={() =>
                setConfirm({
                  kind: "delete-bulk",
                  ids: Array.from(selectedIds) as Id<"users">[],
                })
              }
              className="h-9 gap-1.5"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Hapus
            </Button>
          }
          toolbarActions={
            selectedIds.size > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
                pilihan tersimpan walau filter berubah
              </span>
            ) : null
          }
        />
      </CardContent>

      <ResponsiveAlertDialog
        open={confirm?.kind === "delete-one"}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>Hapus pengguna ini?</ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              {confirm?.kind === "delete-one"
                ? `Akun ${confirm.label} dan semua datanya (CV, lamaran, portofolio, dll) akan dihapus permanen. Tidak bisa di-undo.`
                : ""}
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Batal</ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                if (confirm?.kind === "delete-one") {
                  void handleDeleteOne(confirm.userId);
                }
              }}
            >
              {busy ? "Menghapus…" : "Hapus permanen"}
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>

      <ResponsiveAlertDialog
        open={confirm?.kind === "delete-bulk"}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              {`Hapus ${
                confirm?.kind === "delete-bulk" ? confirm.ids.length : 0
              } pengguna?`}
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              Setiap akun + seluruh datanya (CV, lamaran, portofolio, dll) akan
              dihapus permanen. Tidak bisa di-undo.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Batal</ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                if (confirm?.kind === "delete-bulk") {
                  void handleBulkDelete(confirm.ids);
                }
              }}
            >
              {busy ? "Menghapus…" : "Hapus semua"}
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </Card>
  );
}
