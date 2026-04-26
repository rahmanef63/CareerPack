"use client";

import { useState, useMemo } from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { notify } from "@/shared/lib/notify";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MoreVertical,
  Search,
  Trash2,
  UserCog,
} from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
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
import { formatDateTime } from "@/shared/lib/formatDate";
import { cn } from "@/shared/lib/utils";

type Role = "admin" | "moderator" | "user";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  moderator: "Moderator",
  user: "Pengguna",
};

const ROLE_BADGE_CLASS: Record<Role, string> = {
  admin: "bg-brand/20 text-brand",
  moderator: "bg-warning/20 text-warning",
  user: "bg-muted text-foreground",
};

type AccountTypeFilter = "all" | "real" | "anonymous";
type RoleFilter = "all" | Role;
type SortKey = "createdAt" | "name" | "email" | "role";
type SortDir = "asc" | "desc";

interface UserRow {
  _id: Id<"users">;
  email: string | null;
  name: string | null;
  role: Role;
  createdAt: number;
}

export function UsersPanel() {
  const [query, setQuery] = useState("");
  const [accountType, setAccountType] = useState<AccountTypeFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<Id<"users">>>(new Set());
  const [confirmingBulk, setConfirmingBulk] = useState(false);
  const [confirmingSingle, setConfirmingSingle] = useState<UserRow | null>(null);

  const { results, status, loadMore } = usePaginatedQuery(
    api.admin.queries.listAllUsers,
    {},
    { initialNumItems: 50 },
  );
  const updateRole = useMutation(api.admin.mutations.updateUserRole);
  const deleteUser = useMutation(api.admin.mutations.deleteUser);
  const bulkDelete = useMutation(api.admin.mutations.bulkDeleteUsers);

  // Filter → search → sort pipeline. All client-side because the
  // paginated query already streams the full set in batches; pulling
  // filters/sort onto the server would require new indexes for
  // every column, which isn't worth it for an admin panel.
  const filtered = useMemo(() => {
    if (!results) return null;
    const q = query.trim().toLowerCase();
    return results
      .filter((u) => {
        if (accountType === "real" && !u.email) return false;
        if (accountType === "anonymous" && u.email) return false;
        if (roleFilter !== "all" && u.role !== roleFilter) return false;
        if (!q) return true;
        return (
          (u.email ?? "").toLowerCase().includes(q) ||
          (u.name ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        switch (sortKey) {
          case "createdAt":
            return (a.createdAt - b.createdAt) * dir;
          case "name":
            return (a.name ?? "").localeCompare(b.name ?? "") * dir;
          case "email":
            return (a.email ?? "").localeCompare(b.email ?? "") * dir;
          case "role": {
            const order: Role[] = ["admin", "moderator", "user"];
            return (order.indexOf(a.role) - order.indexOf(b.role)) * dir;
          }
        }
      });
  }, [results, query, accountType, roleFilter, sortKey, sortDir]);

  const visibleIds = useMemo(
    () => new Set((filtered ?? []).map((u) => u._id)),
    [filtered],
  );

  const allVisibleSelected =
    filtered !== null &&
    filtered.length > 0 &&
    filtered.every((u) => selected.has(u._id));
  const someVisibleSelected =
    filtered !== null && filtered.some((u) => selected.has(u._id));

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      const next = new Set(selected);
      for (const u of filtered ?? []) next.delete(u._id);
      setSelected(next);
    } else {
      const next = new Set(selected);
      for (const u of filtered ?? []) next.add(u._id);
      setSelected(next);
    }
  };

  const toggleOne = (id: Id<"users">) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "createdAt" ? "desc" : "asc");
    }
  };

  const handleRoleChange = async (userId: Id<"users">, newRole: Role) => {
    try {
      await updateRole({ userId, role: newRole });
      notify.success("Peran pengguna diperbarui");
    } catch (err) {
      notify.fromError(err, "Gagal memperbarui peran");
    }
  };

  const handleDeleteSingle = async () => {
    if (!confirmingSingle) return;
    try {
      await deleteUser({ userId: confirmingSingle._id });
      notify.success("Pengguna dihapus", {
        description: confirmingSingle.email ?? confirmingSingle.name ?? "Akun anonim",
      });
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(confirmingSingle._id);
        return next;
      });
    } catch (err) {
      notify.fromError(err, "Gagal menghapus pengguna");
    } finally {
      setConfirmingSingle(null);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected).filter((id) => visibleIds.has(id));
    if (ids.length === 0) return;
    try {
      const res = await bulkDelete({ userIds: ids });
      notify.success(`${res.deleted} pengguna dihapus`);
      setSelected(new Set());
    } catch (err) {
      notify.fromError(err, "Gagal menghapus pengguna terpilih");
    } finally {
      setConfirmingBulk(false);
    }
  };

  const selectedVisibleCount = (filtered ?? []).filter((u) =>
    selected.has(u._id),
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Kelola Pengguna
        </CardTitle>
        <CardDescription>
          Cari, filter, urut, dan kelola peran. Hapus akun demo lama secara
          massal lewat ceklis di kolom kiri.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter / search row. Cascades to client-side filter pipeline. */}
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari email atau nama"
              className="pl-9"
            />
          </div>
          <ResponsiveSelect
            value={accountType}
            onValueChange={(v) => setAccountType(v as AccountTypeFilter)}
          >
            <ResponsiveSelectTrigger
              className="h-10 sm:w-[160px]"
              aria-label="Filter jenis akun"
            />
            <ResponsiveSelectContent drawerTitle="Jenis akun">
              <ResponsiveSelectItem value="all">Semua akun</ResponsiveSelectItem>
              <ResponsiveSelectItem value="real">Akun terdaftar</ResponsiveSelectItem>
              <ResponsiveSelectItem value="anonymous">Demo / Anonim</ResponsiveSelectItem>
            </ResponsiveSelectContent>
          </ResponsiveSelect>
          <ResponsiveSelect
            value={roleFilter}
            onValueChange={(v) => setRoleFilter(v as RoleFilter)}
          >
            <ResponsiveSelectTrigger
              className="h-10 sm:w-[140px]"
              aria-label="Filter peran"
            />
            <ResponsiveSelectContent drawerTitle="Filter peran">
              <ResponsiveSelectItem value="all">Semua peran</ResponsiveSelectItem>
              <ResponsiveSelectItem value="admin">Admin</ResponsiveSelectItem>
              <ResponsiveSelectItem value="moderator">Moderator</ResponsiveSelectItem>
              <ResponsiveSelectItem value="user">Pengguna</ResponsiveSelectItem>
            </ResponsiveSelectContent>
          </ResponsiveSelect>
        </div>

        {/* Bulk action bar — only shows when at least one row visible
            in the current filter is selected. Floats above the table
            so the user always sees their working set. */}
        {selectedVisibleCount > 0 && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-brand/40 bg-brand-muted/30 px-3 py-2">
            <p className="text-sm">
              <strong>{selectedVisibleCount}</strong> pengguna terpilih
              {selectedVisibleCount !== selected.size && (
                <span className="text-muted-foreground">
                  {" "}
                  ({selected.size} total termasuk halaman lain)
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelected(new Set())}
              >
                Batal pilih
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmingBulk(true)}
                className="gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                Hapus
              </Button>
            </div>
          </div>
        )}

        {status === "LoadingFirstPage" && (
          <p className="text-sm text-muted-foreground">Memuat pengguna…</p>
        )}

        {filtered && filtered.length === 0 && status !== "LoadingFirstPage" && (
          <p className="text-sm text-muted-foreground">
            {query || accountType !== "all" || roleFilter !== "all"
              ? "Tidak ada pengguna yang cocok dengan filter."
              : "Belum ada pengguna."}
          </p>
        )}

        {filtered && filtered.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="w-10 px-3 py-2">
                    <Checkbox
                      aria-label="Pilih semua di halaman ini"
                      checked={
                        allVisibleSelected
                          ? true
                          : someVisibleSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={toggleAllVisible}
                    />
                  </th>
                  <SortableHeader
                    label="Email / Nama"
                    active={sortKey === "email" || sortKey === "name"}
                    dir={sortDir}
                    onClick={() => handleSort("email")}
                  />
                  <SortableHeader
                    label="Dibuat"
                    className="hidden sm:table-cell"
                    active={sortKey === "createdAt"}
                    dir={sortDir}
                    onClick={() => handleSort("createdAt")}
                  />
                  <SortableHeader
                    label="Peran"
                    active={sortKey === "role"}
                    dir={sortDir}
                    onClick={() => handleSort("role")}
                  />
                  <th className="w-12 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => {
                  const isAnonymous = !u.email;
                  const isSelected = selected.has(u._id);
                  return (
                    <tr
                      key={u._id}
                      className={cn(
                        "align-middle",
                        isSelected && "bg-brand-muted/20",
                      )}
                    >
                      <td className="px-3 py-2">
                        <Checkbox
                          aria-label={`Pilih ${u.email ?? u.name ?? u._id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleOne(u._id)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">
                            {u.email ?? "(akun anonim)"}
                          </span>
                          {u.name && (
                            <span className="text-xs text-muted-foreground">
                              {u.name}
                            </span>
                          )}
                          {isAnonymous && (
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                              Demo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">
                        {formatDateTime(u.createdAt)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={ROLE_BADGE_CLASS[u.role]}
                          >
                            {ROLE_LABELS[u.role]}
                          </Badge>
                          <ResponsiveSelect
                            value={u.role}
                            onValueChange={(v) =>
                              handleRoleChange(u._id, v as Role)
                            }
                          >
                            <ResponsiveSelectTrigger
                              className="h-8 w-[120px]"
                              aria-label={`Ubah peran untuk ${u.email ?? u._id}`}
                            />
                            <ResponsiveSelectContent drawerTitle="Ubah peran">
                              <ResponsiveSelectItem value="user">
                                Pengguna
                              </ResponsiveSelectItem>
                              <ResponsiveSelectItem value="moderator">
                                Moderator
                              </ResponsiveSelectItem>
                              <ResponsiveSelectItem value="admin">
                                Admin
                              </ResponsiveSelectItem>
                            </ResponsiveSelectContent>
                          </ResponsiveSelect>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Aksi untuk ${u.email ?? u._id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(u._id, "user")}
                              disabled={u.role === "user"}
                            >
                              Set ke Pengguna
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(u._id, "moderator")}
                              disabled={u.role === "moderator"}
                            >
                              Set ke Moderator
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(u._id, "admin")}
                              disabled={u.role === "admin"}
                            >
                              Set ke Admin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setConfirmingSingle(u as UserRow)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus pengguna…
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {status === "CanLoadMore" && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" size="sm" onClick={() => loadMore(50)}>
              Muat lebih banyak
            </Button>
          </div>
        )}
        {status === "LoadingMore" && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" size="sm" disabled>
              Memuat…
            </Button>
          </div>
        )}
      </CardContent>

      {/* Single-user delete confirmation. */}
      <AlertDialog
        open={confirmingSingle !== null}
        onOpenChange={(open) => !open && setConfirmingSingle(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pengguna?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmingSingle?.email ?? confirmingSingle?.name ?? "Akun anonim"}
              {" "}akan dihapus permanen beserta CV, lamaran, agenda, dan
              semua data terkait. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSingle}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation. */}
      <AlertDialog
        open={confirmingBulk}
        onOpenChange={(open) => !open && setConfirmingBulk(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus {selectedVisibleCount} pengguna?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Semua data milik pengguna terpilih (CV, lamaran, agenda, kontak,
              file upload) ikut terhapus permanen. Tindakan ini tidak bisa
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus {selectedVisibleCount} akun
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

interface SortableHeaderProps {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  className?: string;
}

function SortableHeader({
  label,
  active,
  dir,
  onClick,
  className,
}: SortableHeaderProps) {
  const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className={cn("px-3 py-2 font-medium", className)}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1.5 text-left transition-colors hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <Icon className="h-3.5 w-3.5 opacity-70" />
      </button>
    </th>
  );
}
