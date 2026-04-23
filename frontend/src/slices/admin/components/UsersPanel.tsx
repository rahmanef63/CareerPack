"use client";

import { useState, useMemo } from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { toast } from "sonner";
import { Search, UserCog } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";

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

const DATE_FMT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function UsersPanel() {
  const [query, setQuery] = useState("");
  const {
    results,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.admin.listAllUsers,
    {},
    { initialNumItems: 25 },
  );
  const updateRole = useMutation(api.admin.updateUserRole);

  const filtered = useMemo(() => {
    if (!results) return null;
    const q = query.trim().toLowerCase();
    if (!q) return results;
    return results.filter((u) =>
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.name ?? "").toLowerCase().includes(q),
    );
  }, [results, query]);

  const handleRoleChange = async (userId: Id<"users">, newRole: Role) => {
    try {
      await updateRole({ userId, role: newRole });
      toast.success("Peran pengguna diperbarui");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui peran");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Kelola Pengguna
        </CardTitle>
        <CardDescription>
          Tetapkan peran admin atau moderator. Perubahan berlaku pada login berikutnya bagi pengguna terkait.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari email atau nama"
            className="pl-9"
          />
        </div>

        {status === "LoadingFirstPage" && (
          <p className="text-sm text-muted-foreground">Memuat pengguna…</p>
        )}

        {filtered && filtered.length === 0 && status !== "LoadingFirstPage" && (
          <p className="text-sm text-muted-foreground">
            {query ? "Tidak ada pengguna yang cocok." : "Belum ada pengguna."}
          </p>
        )}

        {filtered && filtered.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">Email / Nama</th>
                  <th className="hidden px-4 py-2 font-medium sm:table-cell">Dibuat</th>
                  <th className="px-4 py-2 font-medium">Peran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => {
                  const role = u.role as Role;
                  return (
                    <tr key={u._id} className="align-middle">
                      <td className="px-4 py-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{u.email ?? "(tanpa email)"}</span>
                          {u.name && (
                            <span className="text-xs text-muted-foreground">{u.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="hidden px-4 py-2 text-muted-foreground sm:table-cell">
                        {DATE_FMT.format(new Date(u.createdAt))}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={ROLE_BADGE_CLASS[role]}>
                            {ROLE_LABELS[role]}
                          </Badge>
                          <ResponsiveSelect
                            value={role}
                            onValueChange={(v) => handleRoleChange(u._id, v as Role)}
                          >
                            <ResponsiveSelectTrigger
                              className="h-8 w-[130px]"
                              aria-label={`Ubah peran untuk ${u.email ?? u._id}`}
                            />
                            <ResponsiveSelectContent drawerTitle="Ubah peran">
                              <ResponsiveSelectItem value="user">Pengguna</ResponsiveSelectItem>
                              <ResponsiveSelectItem value="moderator">Moderator</ResponsiveSelectItem>
                              <ResponsiveSelectItem value="admin">Admin</ResponsiveSelectItem>
                            </ResponsiveSelectContent>
                          </ResponsiveSelect>
                        </div>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMore(25)}
            >
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
    </Card>
  );
}
