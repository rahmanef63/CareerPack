"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Search,
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
import { Input } from "@/shared/components/ui/input";
import { Checkbox } from "@/shared/components/ui/checkbox";
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

type Role = "admin" | "moderator" | "user";
type AccountFilter = "all" | "real" | "anonymous";
type SortKey =
  | "createdAt"
  | "email"
  | "fullName"
  | "targetRole"
  | "role"
  | "skillsCount";
type SortDir = "asc" | "desc";

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
 * bulk role-change + bulk delete.
 *
 * Data source: api.admin.queries.listUsersWithProfiles (top 200).
 * Mutations: api.admin.mutations.{updateUserRole, deleteUser, bulkDeleteUsers}.
 *
 * Selection state survives filter / sort / search changes — we key
 * by userId so a user that drops out of the visible page stays
 * selected if they come back. Bulk action bar floats once ≥ 1 row
 * is selected.
 */
export function UsersTable() {
  const users = useQuery(api.admin.queries.listUsersWithProfiles);
  const updateRole = useMutation(api.admin.mutations.updateUserRole);
  const deleteOne = useMutation(api.admin.mutations.deleteUser);
  const bulkDelete = useMutation(api.admin.mutations.bulkDeleteUsers);

  const [query, setQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | Role>("all");
  const [filterAccount, setFilterAccount] = useState<AccountFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [selected, setSelected] = useState<Set<Id<"users">>>(new Set());
  const [pendingId, setPendingId] = useState<Id<"users"> | null>(null);
  const [confirm, setConfirm] = useState<
    | { kind: "delete-one"; userId: Id<"users">; label: string }
    | { kind: "delete-bulk"; ids: Id<"users">[] }
    | null
  >(null);
  const [busy, setBusy] = useState(false);

  // ---- derived list ----
  const filtered = useMemo(() => {
    if (!users) return [];
    const q = query.trim().toLowerCase();
    let out = users.filter((u) => {
      if (filterRole !== "all" && u.role !== filterRole) return false;
      if (filterAccount === "real" && !u.email) return false;
      if (filterAccount === "anonymous" && u.email) return false;
      if (q) {
        const hay = [
          u.email,
          u.name,
          u.fullName,
          u.targetRole,
          u.location,
          u.experienceLevel,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    out = [...out].sort((a, b) => cmp(a, b, sortKey, sortDir));
    return out;
  }, [users, query, filterRole, filterAccount, sortKey, sortDir]);

  const visibleIds = useMemo(
    () => filtered.map((u) => u.userId),
    [filtered],
  );
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someVisibleSelected =
    !allVisibleSelected && visibleIds.some((id) => selected.has(id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  };
  const toggleOne = (id: Id<"users">) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const onSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "createdAt" || key === "skillsCount" ? "desc" : "asc");
    }
  };

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
      setSelected((prev) => {
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
      clearSelection();
      notify.success(`${res.deleted} pengguna dihapus`);
    } catch (err) {
      notify.fromError(err, "Gagal menghapus massal");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Pengguna</CardTitle>
        <CardDescription>
          200 pengguna terbaru. Cari, sortir, filter, pilih banyak baris untuk
          aksi massal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[14rem]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari email, nama, target role, lokasi…"
              className="pl-9"
              aria-label="Cari pengguna"
            />
          </div>
          <Select
            value={filterRole}
            onValueChange={(v) => setFilterRole(v as "all" | Role)}
          >
            <SelectTrigger className="w-[10rem]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua role</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterAccount}
            onValueChange={(v) => setFilterAccount(v as AccountFilter)}
          >
            <SelectTrigger className="w-[12rem]">
              <SelectValue placeholder="Tipe akun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua akun</SelectItem>
              <SelectItem value="real">Akun terdaftar (email)</SelectItem>
              <SelectItem value="anonymous">Demo / Anonim</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="ml-auto whitespace-nowrap">
            {filtered.length} dari {users?.length ?? 0}
          </Badge>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand/40 bg-brand-muted/40 p-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-brand" />
            <span className="font-medium">
              {selected.size} dipilih
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-7"
            >
              Bersihkan
            </Button>
            <span className="ml-auto" />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={() =>
                setConfirm({ kind: "delete-bulk", ids: Array.from(selected) })
              }
              className="gap-1.5"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Hapus terpilih
            </Button>
          </div>
        )}

        {/* Table */}
        {users === undefined ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Memuat…
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {query || filterRole !== "all" || filterAccount !== "all"
              ? "Tidak ada pengguna cocok dengan filter."
              : "Belum ada pengguna."}
          </p>
        ) : (
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        allVisibleSelected
                          ? true
                          : someVisibleSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={toggleAll}
                      aria-label="Pilih semua"
                    />
                  </TableHead>
                  <SortableHeader
                    label="Email"
                    column="email"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={onSort}
                  />
                  <SortableHeader
                    label="Nama"
                    column="fullName"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={onSort}
                  />
                  <SortableHeader
                    label="Target Role"
                    column="targetRole"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={onSort}
                  />
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Level</TableHead>
                  <SortableHeader
                    label="Role"
                    column="role"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={onSort}
                  />
                  <SortableHeader
                    label="Skills"
                    column="skillsCount"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={onSort}
                    align="right"
                  />
                  <SortableHeader
                    label="Daftar"
                    column="createdAt"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={onSort}
                    align="right"
                  />
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const isSel = selected.has(u.userId);
                  const isPending = pendingId === u.userId;
                  return (
                    <TableRow
                      key={u.userId}
                      data-state={isSel ? "selected" : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSel}
                          onCheckedChange={() => toggleOne(u.userId)}
                          aria-label={`Pilih ${u.email || u.name || u.userId}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {u.email || (
                          <span className="italic text-muted-foreground">
                            (anonim)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{u.fullName || u.name || "—"}</TableCell>
                      <TableCell>{u.targetRole || "—"}</TableCell>
                      <TableCell>{u.location || "—"}</TableCell>
                      <TableCell>{u.experienceLevel || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "border-transparent text-[10px]",
                            ROLE_BADGE[u.role as Role] ?? ROLE_BADGE.user,
                          )}
                        >
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {u.skillsCount}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={isPending || busy}
                              aria-label="Aksi pengguna"
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
                              {u.email || "Pengguna anonim"}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() =>
                                handleRoleChange(u.userId, NEXT_ROLE[u.role as Role])
                              }
                            >
                              <UserCog className="mr-2 h-4 w-4" />
                              Set role: {NEXT_ROLE[u.role as Role]}
                            </DropdownMenuItem>
                            {(u.role as Role) !== "admin" && (
                              <DropdownMenuItem
                                onSelect={() =>
                                  handleRoleChange(u.userId, "admin")
                                }
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Jadikan admin
                              </DropdownMenuItem>
                            )}
                            {(u.role as Role) !== "user" && (
                              <DropdownMenuItem
                                onSelect={() =>
                                  handleRoleChange(u.userId, "user")
                                }
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
                                  userId: u.userId,
                                  label: u.email || u.fullName || "pengguna ini",
                                })
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus akun
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

function cmp(a: RowData, b: RowData, key: SortKey, dir: SortDir): number {
  const sign = dir === "asc" ? 1 : -1;
  if (key === "createdAt" || key === "skillsCount") {
    return sign * (Number(a[key]) - Number(b[key]));
  }
  const av = String(a[key] ?? "").toLowerCase();
  const bv = String(b[key] ?? "").toLowerCase();
  return sign * av.localeCompare(bv);
}

interface SortableHeaderProps {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (col: SortKey) => void;
  align?: "left" | "right";
}

function SortableHeader({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
  align = "left",
}: SortableHeaderProps) {
  const active = sortKey === column;
  const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead className={align === "right" ? "text-right" : ""}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "inline-flex items-center gap-1 text-left font-medium transition-colors hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground",
          align === "right" && "ml-auto flex-row-reverse",
        )}
      >
        {label}
        <Icon className="h-3 w-3 opacity-70" />
      </button>
    </TableHead>
  );
}
