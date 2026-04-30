"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Upload } from "lucide-react";
import { notify } from "@/shared/lib/notify";
import { api } from "../../../../../convex/_generated/api";

import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { Button } from "@/shared/components/ui/button";
import { FileUpload } from "@/shared/components/files/FileUpload";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
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
import { PageContainer } from "@/shared/components/layout/PageContainer";

import type { LibraryFile, KindFilter } from "../types/file";
import { LibraryToolbar } from "./library-view/LibraryToolbar";
import { LibraryGrid } from "./library-view/LibraryGrid";
import { EditMetadataDialog } from "./library-view/EditMetadataDialog";

/**
 * Content Library — central store for all user uploads. Lets the
 * user upload, tag, rename, and delete media that the rest of the
 * app references via storageId. Usage indicator shows how many
 * portfolio items reference each file so deletions are informed.
 */
export function LibraryView() {
  const files = useQuery(api.files.queries.listMyFiles, {}) as
    | LibraryFile[]
    | undefined;
  const updateMetadata = useMutation(api.files.mutations.updateFileMetadata);
  const deleteFile = useMutation(api.files.mutations.deleteFile);

  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [editFile, setEditFile] = useState<LibraryFile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<LibraryFile | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const f of files ?? []) for (const t of f.tags ?? []) s.add(t);
    return Array.from(s).sort();
  }, [files]);

  const filtered = useMemo(() => {
    if (!files) return [];
    let list = files;
    if (kind === "image") list = list.filter((f) => f.fileType.startsWith("image/"));
    else if (kind === "pdf") list = list.filter((f) => f.fileType === "application/pdf");
    if (activeTag) list = list.filter((f) => (f.tags ?? []).includes(activeTag));
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (f) =>
          f.fileName.toLowerCase().includes(q) ||
          (f.note ?? "").toLowerCase().includes(q) ||
          (f.tags ?? []).some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [files, search, kind, activeTag]);

  const stats = useMemo(() => {
    const total = files?.length ?? 0;
    const totalBytes = (files ?? []).reduce((s, f) => s + f.fileSize, 0);
    const used = (files ?? []).filter((f) => f.usedIn.length > 0).length;
    return { total, totalBytes, used };
  }, [files]);

  return (
    <PageContainer size="lg" className="space-y-6">
      <ResponsivePageHeader
        title="Content Library"
        description="Pusat media: semua gambar dan dokumen yang kamu unggah, siap dipakai ulang di portfolio, CV, dan personal branding."
        actions={
          <Button size="sm" className="gap-2" onClick={() => setShowUpload(true)}>
            <Upload className="h-4 w-4" />
            <span>Unggah</span>
          </Button>
        }
      />

      <LibraryToolbar
        stats={stats}
        search={search}
        onSearchChange={setSearch}
        kind={kind}
        onKindChange={setKind}
        allTags={allTags}
        activeTag={activeTag}
        onActiveTagChange={setActiveTag}
      />

      <LibraryGrid
        files={files}
        filtered={filtered}
        onEdit={setEditFile}
        onDelete={setConfirmDelete}
      />

      <ResponsiveDialog open={showUpload} onOpenChange={setShowUpload}>
        <ResponsiveDialogContent className="sm:max-w-lg">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Unggah ke Library</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              File otomatis tersedia di Library setelah selesai upload. Bisa di-tag setelahnya.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <FileUpload
            label=""
            onUploaded={() => {
              notify.success("File terunggah");
              setShowUpload(false);
            }}
          />
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <EditMetadataDialog
        file={editFile}
        onClose={() => setEditFile(null)}
        onSave={async (id, data) => {
          await updateMetadata({ fileId: id, ...data });
          notify.success("Metadata diperbarui");
          setEditFile(null);
        }}
      />

      <ResponsiveAlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>Hapus file?</ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              {confirmDelete?.usedIn.length
                ? `Masih dipakai oleh: ${confirmDelete.usedIn.join(", ")}. Menghapus akan membuat referensi rusak.`
                : "File dihapus permanen dari storage."}
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Batal</ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!confirmDelete) return;
                try {
                  await deleteFile({ fileId: confirmDelete._id });
                  notify.success("File dihapus");
                } catch (err) {
                  notify.fromError(err, "Gagal menghapus");
                } finally {
                  setConfirmDelete(null);
                }
              }}
            >
              Hapus
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </PageContainer>
  );
}
