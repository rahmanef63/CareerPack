"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import {
  FileText,
  Image as ImageIcon,
  Search,
  Trash2,
  Upload,
  X,
  Tag,
  Edit3,
} from "lucide-react";
import { notify } from "@/shared/lib/notify";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { FileUpload } from "@/shared/components/files/FileUpload";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
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
import { cn } from "@/shared/lib/utils";

interface LibraryFile {
  _id: Id<"files">;
  storageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string | null;
  tags?: string[];
  note?: string;
  usedIn: string[];
  createdAt: number;
}

type KindFilter = "all" | "image" | "pdf";

const KIND_OPTIONS: ReadonlyArray<{ value: KindFilter; label: string }> = [
  { value: "all", label: "Semua tipe" },
  { value: "image", label: "Gambar" },
  { value: "pdf", label: "PDF" },
];

function bytesToHuman(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatBox label="Total file" value={stats.total} />
        <StatBox label="Dipakai" value={stats.used} />
        <StatBox label="Ukuran" value={bytesToHuman(stats.totalBytes)} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, catatan, tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
          {search && (
            <button
              type="button"
              aria-label="Bersihkan"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <ResponsiveSelect value={kind} onValueChange={(v) => setKind(v as KindFilter)}>
          <ResponsiveSelectTrigger className="h-9 w-[140px]" />
          <ResponsiveSelectContent>
            {KIND_OPTIONS.map((o) => (
              <ResponsiveSelectItem key={o.value} value={o.value}>
                {o.label}
              </ResponsiveSelectItem>
            ))}
          </ResponsiveSelectContent>
        </ResponsiveSelect>
      </div>

      {/* Tag chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((t) => {
            const active = activeTag === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTag(active ? null : t)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                #{t}
              </button>
            );
          })}
          {activeTag && (
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Bersihkan
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {files === undefined ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <ImageIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            {files.length === 0
              ? "Library kosong"
              : "Tidak ada file yang cocok dengan filter."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Unggah lewat tombol di atas, atau dari form portfolio/CV.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((f) => {
            const isImage = f.fileType.startsWith("image/");
            const Icon = isImage ? ImageIcon : FileText;
            return (
              <li
                key={f._id}
                className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-square bg-muted">
                  {isImage && f.url ? (
                    <Image
                      src={f.url}
                      alt={f.fileName}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, 240px"
                      className="object-cover"
                    />
                  ) : (
                    <a
                      href={f.url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-full w-full items-center justify-center"
                    >
                      <Icon className="h-10 w-10 text-muted-foreground" />
                    </a>
                  )}
                  {f.usedIn.length > 0 && (
                    <Badge className="absolute left-1 top-1 h-5 px-1.5 text-[10px]">
                      {f.usedIn.length}× pakai
                    </Badge>
                  )}
                  <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7 shadow"
                      onClick={() => setEditFile(f)}
                      aria-label="Edit metadata"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7 shadow"
                      onClick={() => setConfirmDelete(f)}
                      aria-label="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 p-2">
                  <p className="truncate text-xs font-medium">{f.fileName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {bytesToHuman(f.fileSize)}
                  </p>
                  {(f.tags?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-0.5">
                      {f.tags!.slice(0, 3).map((t) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="h-4 gap-0.5 px-1 text-[9px]"
                        >
                          <Tag className="h-2 w-2" />
                          {t}
                        </Badge>
                      ))}
                      {f.tags!.length > 3 && (
                        <Badge variant="outline" className="h-4 px-1 text-[9px]">
                          +{f.tags!.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Upload dialog */}
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

      {/* Edit metadata dialog */}
      <EditMetadataDialog
        file={editFile}
        onClose={() => setEditFile(null)}
        onSave={async (id, data) => {
          await updateMetadata({ fileId: id, ...data });
          notify.success("Metadata diperbarui");
          setEditFile(null);
        }}
      />

      {/* Delete confirm */}
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

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function EditMetadataDialog({
  file,
  onClose,
  onSave,
}: {
  file: LibraryFile | null;
  onClose: () => void;
  onSave: (id: Id<"files">, data: { tags?: string[]; note?: string; fileName?: string }) => Promise<void>;
}) {
  const [fileName, setFileName] = useState("");
  const [note, setNote] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // Reset state when a different file is being edited.
  useMemo(() => {
    if (file) {
      setFileName(file.fileName);
      setNote(file.note ?? "");
      setTags(file.tags ?? []);
      setTagDraft("");
    }
  }, [file]);

  if (!file) return null;

  const addTag = () => {
    const t = tagDraft.trim().toLowerCase();
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setTagDraft("");
  };

  return (
    <ResponsiveDialog open={!!file} onOpenChange={(o) => { if (!o) onClose(); }}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Edit metadata</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Tag dan catatan membantu kamu menemukan media saat library bertumbuh.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Nama file</Label>
            <Input value={fileName} onChange={(e) => setFileName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Catatan</Label>
            <Textarea
              rows={2}
              value={note}
              placeholder="Konteks singkat — contoh: 'Hero untuk landing page Acme'"
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Tag</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Tekan Enter"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Tambah
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1 pr-1">
                    {t}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((x) => x !== t))}
                      className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                      aria-label={`Hapus ${t}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onSave(file._id, { tags, note, fileName });
              } catch (err) {
                notify.fromError(err, "Gagal menyimpan");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Menyimpan…" : "Simpan"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
