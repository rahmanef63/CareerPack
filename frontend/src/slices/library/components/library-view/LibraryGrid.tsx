"use client";

import Image from "next/image";
import { FileText, Image as ImageIcon, Tag, Edit3, Trash2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { bytesToHuman, type LibraryFile } from "../../types/file";

interface Props {
  files: LibraryFile[] | undefined;
  filtered: LibraryFile[];
  onEdit: (f: LibraryFile) => void;
  onDelete: (f: LibraryFile) => void;
}

export function LibraryGrid({ files, filtered, onEdit, onDelete }: Props) {
  if (files === undefined) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
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
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {filtered.map((f) => (
        <LibraryCard key={f._id} file={f} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  );
}

function LibraryCard({
  file: f, onEdit, onDelete,
}: {
  file: LibraryFile;
  onEdit: (f: LibraryFile) => void;
  onDelete: (f: LibraryFile) => void;
}) {
  const isImage = f.fileType.startsWith("image/");
  const Icon = isImage ? ImageIcon : FileText;
  return (
    <li className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md">
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
            onClick={() => onEdit(f)}
            aria-label="Edit metadata"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="h-7 w-7 shadow"
            onClick={() => onDelete(f)}
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
}
