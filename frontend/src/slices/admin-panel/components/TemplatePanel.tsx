"use client";

import {
  Database, Download, Eye, EyeOff, GraduationCap,
  Link2, Loader2, Plus, Trash2, Upload,
} from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { DataTable } from "@/shared/components/data-table";
import { EMPTY_DRAFT } from "./template-panel/types";
import { TemplateEditorSheet } from "./template-panel/TemplateEditorSheet";
import { LinkAuditDialog } from "./template-panel/LinkAuditDialog";
import { ImportConfirmDialog } from "./template-panel/ImportConfirmDialog";
import {
  buildTemplateColumns, buildTemplateFilters,
} from "./template-panel/columns";
import { useTemplatePanel } from "./template-panel/useTemplatePanel";

export function TemplatePanel() {
  const p = useTemplatePanel();
  type Tpl = NonNullable<typeof p.templates>[number];

  const domainCount = p.templates
    ? Object.entries(
        p.templates.reduce<Record<string, number>>((acc, t) => {
          acc[t.domain] = (acc[t.domain] ?? 0) + 1;
          return acc;
        }, {})
      )
    : [];

  const columns = buildTemplateColumns<Tpl>({
    togglePublic: (args) => { void p.togglePublic(args); },
    onExportOne: p.handleExportOne,
    onDuplicate: p.openDuplicate,
    onEdit: p.openEdit,
    onDelete: p.setDeleteTarget,
  });
  const filters = buildTemplateFilters<Tpl>();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-brand" />
                Template Roadmap
              </CardTitle>
              <CardDescription className="mt-1">
                Kelola template roadmap yang tersedia untuk pengguna. Pengguna memilih template → progress disimpan per-akun.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => p.handleSeedDefaults(false)} disabled={p.seeding}>
                {p.seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                Muat Default
              </Button>
              <Button size="sm" variant="outline" onClick={() => p.handleSeedDefaults(true)} disabled={p.seeding} title="Timpa template yang sudah ada">
                Muat + Timpa
              </Button>
              <Button size="icon" variant="outline" onClick={p.handleExportAll} disabled={!p.templates || p.templates.length === 0} title="Ekspor semua template ke JSON" aria-label="Ekspor semua" className="h-9 w-9">
                <Download className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => p.fileInputRef.current?.click()} title="Impor template dari file JSON" aria-label="Impor JSON" className="h-9 w-9">
                <Upload className="w-4 h-4" />
              </Button>
              <input ref={p.fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={p.handleImportFile} />
              <Button size="icon" variant="outline" onClick={p.handleRunAudit} disabled={!p.templates || p.templates.length === 0} title="Audit link rusak / placeholder di semua template" aria-label="Audit link" className="h-9 w-9">
                <Link2 className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={() => p.setDraft({ ...EMPTY_DRAFT })}>
                <Plus className="w-4 h-4 mr-2" />
                Buat Template
              </Button>
            </div>
          </div>

          {domainCount.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {domainCount.map(([domain, count]) => (
                <Badge key={domain} variant="secondary" className="text-xs">
                  {domain}: {count}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent>
          <DataTable<Tpl>
            data={p.templates ?? []}
            columns={columns}
            filters={filters}
            rowKey={(t) => t._id}
            searchAccessor={(t) => [t.title, t.slug, t.description, ...t.tags].join(" ")}
            searchPlaceholder="Cari judul, slug, atau tag…"
            selectedIds={p.selectedIds}
            onSelectionChange={p.setSelectedIds}
            isLoading={p.templates === undefined}
            emptyMessage="Belum ada template. Klik &quot;Muat Default&quot; atau buat baru."
            initialPageSize={25}
            bulkActions={
              <>
                <Button size="sm" variant="outline" onClick={p.handleBulkExport} disabled={p.bulkActing} className="h-9">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Ekspor
                </Button>
                <Button size="sm" variant="outline" onClick={() => p.handleBulkVisibility(true)} disabled={p.bulkActing} className="h-9">
                  <Eye className="w-3.5 h-3.5 mr-1.5" /> Tampilkan
                </Button>
                <Button size="sm" variant="outline" onClick={() => p.handleBulkVisibility(false)} disabled={p.bulkActing} className="h-9">
                  <EyeOff className="w-3.5 h-3.5 mr-1.5" /> Sembunyikan
                </Button>
                <Button size="sm" variant="destructive" onClick={() => p.setBulkDeleteOpen(true)} disabled={p.bulkActing} className="h-9">
                  {p.bulkActing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
                  Hapus
                </Button>
              </>
            }
          />
        </CardContent>
      </Card>

      <TemplateEditorSheet
        draft={p.draft}
        setDraft={p.setDraft}
        saving={p.saving}
        onSave={p.handleSave}
        onExport={p.handleExportDraft}
        onSheetImport={p.handleSheetImport}
      />

      <ImportConfirmDialog
        importDraft={p.importDraft}
        importOverwrite={p.importOverwrite}
        setImportOverwrite={p.setImportOverwrite}
        importing={p.importing}
        onCancel={() => p.setImportDraft(null)}
        onConfirm={() => { void p.handleConfirmImport(); }}
      />

      <LinkAuditDialog
        issues={p.auditIssues}
        onClose={() => p.setAuditIssues(null)}
        onCopy={p.handleAuditCopy}
        onCsv={p.handleAuditCsv}
      />

      <AlertDialog open={p.bulkDeleteOpen} onOpenChange={(o) => !o && !p.bulkActing && p.setBulkDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {p.selectedIds.size} template?</AlertDialogTitle>
            <AlertDialogDescription>
              Template sistem akan dilewati otomatis. Roadmap pengguna yang
              sudah di-seed tidak terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={p.bulkActing}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void p.handleBulkDelete(); }}
              disabled={p.bulkActing}
              className="bg-destructive text-destructive-foreground"
            >
              {p.bulkActing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!p.deleteTarget} onOpenChange={(o) => !o && p.setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Template akan dihapus permanen. Roadmap pengguna yang sudah di-seed tidak terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={p.handleDelete} className="bg-destructive text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
