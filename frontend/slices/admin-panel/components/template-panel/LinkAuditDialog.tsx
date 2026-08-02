"use client";

import { Copy, Download, Link2 } from "lucide-react";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import type { LinkIssue } from "../../types/template";

interface LinkAuditDialogProps {
  issues: LinkIssue[] | null;
  onClose: () => void;
  onCopy: () => void;
  onCsv: () => void;
}

export function LinkAuditDialog({ issues, onClose, onCopy, onCsv }: LinkAuditDialogProps) {
  return (
    <AlertDialog open={issues !== null} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Hasil Audit Link
          </AlertDialogTitle>
          <AlertDialogDescription>
            {issues && issues.length === 0
              ? "Tidak ada masalah link terdeteksi. Semua URL terlihat sehat."
              : issues
                ? `${issues.length} masalah ditemukan. Salin atau ekspor CSV, perbaiki via fitur Ekspor JSON → edit → Impor JSON.`
                : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {issues && issues.length > 0 && (
          <div className="max-h-96 overflow-auto rounded border bg-muted/20 text-xs">
            <table className="w-full">
              <thead className="bg-muted/60 sticky top-0">
                <tr className="text-left">
                  <th className="px-2 py-1.5 font-medium">Template</th>
                  <th className="px-2 py-1.5 font-medium">Node</th>
                  <th className="px-2 py-1.5 font-medium">URL</th>
                  <th className="px-2 py-1.5 font-medium">Masalah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {issues.slice(0, 200).map((i, idx) => (
                  <tr key={`${i.templateId}-${i.nodeId}-${idx}`}>
                    <td className="px-2 py-1.5 font-mono text-[11px]">{i.templateSlug}</td>
                    <td className="px-2 py-1.5 font-mono text-[11px]">{i.nodeId}</td>
                    <td className="px-2 py-1.5 font-mono text-[11px] max-w-[260px] truncate" title={i.url}>
                      {i.url || <span className="italic text-muted-foreground">(kosong)</span>}
                    </td>
                    <td className="px-2 py-1.5 text-destructive">{i.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {issues.length > 200 && (
              <p className="px-3 py-2 text-muted-foreground italic">
                …{issues.length - 200} masalah lain. Ekspor CSV untuk lihat semua.
              </p>
            )}
          </div>
        )}

        <AlertDialogFooter>
          {issues && issues.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={onCopy}>
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Salin
              </Button>
              <Button variant="outline" size="sm" onClick={onCsv}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> CSV
              </Button>
            </>
          )}
          <AlertDialogCancel>Tutup</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
