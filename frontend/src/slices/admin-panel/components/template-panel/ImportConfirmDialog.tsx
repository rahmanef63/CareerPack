"use client";

import { Loader2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import type { ExportTemplate } from "../../types/template";

interface ImportConfirmDialogProps {
  importDraft: ExportTemplate[] | null;
  importOverwrite: boolean;
  setImportOverwrite: (v: boolean) => void;
  importing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ImportConfirmDialog({
  importDraft, importOverwrite, setImportOverwrite,
  importing, onCancel, onConfirm,
}: ImportConfirmDialogProps) {
  return (
    <AlertDialog open={!!importDraft} onOpenChange={(o) => !o && !importing && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Impor Template?</AlertDialogTitle>
          <AlertDialogDescription>
            {importDraft && (
              <>
                File berisi <strong>{importDraft.length}</strong> template.
                Slug yang sudah ada akan {importOverwrite ? "ditimpa" : "dilewati"}.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {importDraft && importDraft.length > 0 && (
          <div className="max-h-48 overflow-y-auto rounded border bg-muted/30 px-3 py-2 text-xs space-y-1">
            {importDraft.slice(0, 20).map((t) => (
              <div key={t.slug} className="flex items-center justify-between gap-2">
                <span className="font-mono truncate">{t.slug}</span>
                <span className="text-muted-foreground truncate">{t.title}</span>
                <Badge variant="outline" className="text-[10px] shrink-0">{t.nodes.length} node</Badge>
              </div>
            ))}
            {importDraft.length > 20 && (
              <p className="text-muted-foreground italic">…dan {importDraft.length - 20} lainnya</p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Switch
            id="import-overwrite"
            checked={importOverwrite}
            onCheckedChange={setImportOverwrite}
            disabled={importing}
          />
          <Label htmlFor="import-overwrite" className="cursor-pointer">
            Timpa template yang sudah ada (cocok untuk perbaiki link rusak)
          </Label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={importing}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={importing}
          >
            {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Impor
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
