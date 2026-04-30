"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { Search, FileText, Video, Image as ImageIcon } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";

interface LibraryFile {
  _id: string;
  storageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string | null;
  tags?: string[];
  note?: string;
  usedIn: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Filter pickable files by major MIME type (e.g. "image" → image/*). */
  accept?: "image" | "pdf" | "any";
  onPick: (file: LibraryFile) => void;
}

/**
 * Reusable picker that surfaces the user's content library inside a
 * dialog. Powers the "pick from library" flow in the portfolio form
 * and (later) CV/branding editors so media lives once and gets
 * referenced everywhere.
 */
export function LibraryPicker({ open, onOpenChange, accept = "any", onPick }: Props) {
  const files = useQuery(api.files.queries.listMyFiles, open ? {} : "skip") as
    | LibraryFile[]
    | undefined;
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!files) return [];
    let list = files;
    if (accept === "image") list = list.filter((f) => f.fileType.startsWith("image/"));
    else if (accept === "pdf") list = list.filter((f) => f.fileType === "application/pdf");

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
  }, [files, search, accept]);

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-3xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Pilih dari Library</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Reuse media yang sudah pernah diunggah. Hemat kuota dan
            menjaga konsistensi visual.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama file, catatan, atau tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {files === undefined ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {files.length === 0
                ? "Belum ada media tersimpan. Unggah lewat form ini, lalu reuse di tempat lain."
                : "Tidak ada file yang cocok."}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((f) => {
                const isImage = f.fileType.startsWith("image/");
                const Icon = isImage ? ImageIcon : f.fileType === "application/pdf" ? FileText : Video;
                return (
                  <li key={f._id}>
                    <button
                      type="button"
                      onClick={() => onPick(f)}
                      className={cn(
                        "group flex aspect-square w-full flex-col overflow-hidden rounded-lg border-2 border-border bg-card text-left transition-all hover:border-brand",
                      )}
                    >
                      <div className="relative flex-1 bg-muted">
                        {isImage && f.url ? (
                          <Image
                            src={f.url}
                            alt={f.fileName}
                            fill
                            unoptimized
                            sizes="160px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Icon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        {f.usedIn.length > 0 && (
                          <Badge className="absolute left-1 top-1 h-4 px-1 text-[9px]">
                            {f.usedIn.length}× pakai
                          </Badge>
                        )}
                      </div>
                      <div className="p-1.5">
                        <p className="truncate text-[10px] font-medium">{f.fileName}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
