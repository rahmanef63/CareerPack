"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, RotateCcw } from "lucide-react";
import { notify } from "@/shared/lib/notify";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { api } from "../../../../../../convex/_generated/api";

/**
 * Riwayat tab — shows every Quick Fill batch the user has run, newest
 * first, with an Undo button. Undo only deletes the rows the batch
 * inserted, preserving anything the user has manually added since.
 */
export function BatchHistoryPanel() {
  const batches = useQuery(api.onboarding.queries.listBatches, {});
  const undoBatch = useMutation(api.onboarding.mutations.undoBatch);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleUndo = async (batchId: string) => {
    if (busyId) return;
    if (!confirm("Yakin batalkan import ini? Item yang dimasukkan batch ini akan dihapus permanen, profil dikembalikan ke versi sebelum import.")) {
      return;
    }
    setBusyId(batchId);
    try {
      const res = await undoBatch({ batchId: batchId as Parameters<typeof undoBatch>[0]["batchId"] });
      notify.success(`Dibatalkan — ${res.deleted} item dihapus`);
    } catch (err) {
      notify.fromError(err, "Gagal membatalkan");
    } finally {
      setBusyId(null);
    }
  };

  if (batches === undefined) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (batches.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Belum ada riwayat. Setelah Anda menjalankan Isi Cepat, semua import akan
        muncul di sini — bisa di-undo individual kalau salah data.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Hapus seluruh isi import ini sekaligus jika datanya salah. Profil akan
        dikembalikan ke versi sebelum import (kalau batch ini menyentuh profil).
      </p>
      {batches.map((b) => {
        const counts: string[] = [];
        if (b.profileTouched) counts.push("profil");
        if (b.cvIds.length) counts.push(`${b.cvIds.length} CV`);
        if (b.portfolioIds.length) counts.push(`${b.portfolioIds.length} portofolio`);
        if (b.goalIds.length) counts.push(`${b.goalIds.length} goal`);
        if (b.applicationIds.length) counts.push(`${b.applicationIds.length} lamaran`);
        if (b.contactIds.length) counts.push(`${b.contactIds.length} kontak`);
        const label = counts.length > 0 ? counts.join(" · ") : "kosong";
        const date = new Date(b.createdAt);
        const dateStr = date.toLocaleString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const isBusy = busyId === b._id;
        return (
          <div
            key={b._id}
            className={cn(
              "rounded-lg border bg-card p-3",
              b.undone ? "border-border opacity-60" : "border-border",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {b.scope}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{dateStr}</span>
                  {b.undone && (
                    <Badge
                      variant="outline"
                      className="border-destructive/40 text-[10px] text-destructive"
                    >
                      Sudah dibatalkan
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium">{label}</p>
                {b.warnings.length > 0 && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                    {b.warnings[0]}
                  </p>
                )}
              </div>
              <div className="shrink-0">
                {b.undone ? (
                  <span className="text-[11px] text-muted-foreground">—</span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => handleUndo(b._id)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Batalkan
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
