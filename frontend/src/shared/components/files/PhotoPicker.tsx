"use client";

import { useState } from "react";
import Image from "next/image";
import { Link as LinkIcon, Upload, ImageIcon, Trash2, Check, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from "@/shared/components/ui/responsive-dialog";
import { FileUpload, type FileUploadResult } from "./FileUpload";
import { LibraryPicker } from "./LibraryPicker";

interface PhotoPickerProps {
  /** Resolved URL to render — can be Convex storage URL or external. */
  previewUrl?: string | null;
  /** Set when current photo is a Convex blob (vs external URL). */
  hasStorage?: boolean;
  /** Called when user uploads a fresh file (file flow). */
  onUpload: (result: FileUploadResult) => void;
  /** Called when user pastes an external URL. */
  onUrl: (url: string) => void;
  /** Called when user picks an existing library file. */
  onPickFromLibrary: (file: { storageId: string; url: string | null }) => void;
  /** Clear the photo entirely. */
  onClear: () => void;
  /** Forwarded to upload dialog (e.g. `4 / 6` for CV portrait). */
  cropAspect?: number;
  /** Optional max-size hint, surfaced in the upload dialog text. */
  uploadHint?: string;
  /** Disable all interactions. */
  disabled?: boolean;
  className?: string;
}

/**
 * Compact 1-row photo input with three input modes:
 *
 *   [thumb] [URL] [Upload] [Library] [Clear]
 *
 * - URL    → expands an inline text field (paste a hosted image URL)
 * - Upload → opens a `<ResponsiveDialog>` containing `<FileUpload>`
 *            (becomes a Drawer on mobile via ResponsiveDialog)
 * - Library→ opens `<LibraryPicker>` filtered to images
 *
 * Replaces the previous large drop-zone / preview block in the CV
 * form. UI footprint shrinks from ~140px tall to a single row when
 * idle. Reuses the project's existing `<FileUpload>`, `<LibraryPicker>`,
 * and `<ResponsiveDialog>` primitives — no new viewport logic here.
 */
export function PhotoPicker({
  previewUrl,
  hasStorage,
  onUpload,
  onUrl,
  onPickFromLibrary,
  onClear,
  cropAspect,
  uploadHint,
  disabled,
  className,
}: PhotoPickerProps) {
  const [urlMode, setUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const hasPhoto = !!previewUrl;

  const submitUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return;
    }
    // Reject `javascript:` / `vbscript:` / `file:` etc. — only http(s)
    // and data: are safe to render via <img src>. data: keeps the door
    // open for inline base64 paste from screenshot tooling.
    const allowed = ["http:", "https:", "data:"];
    if (!allowed.includes(parsed.protocol)) return;
    onUrl(trimmed);
    setUrlInput("");
    setUrlMode(false);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        {/* Thumbnail or placeholder */}
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
          {hasPhoto ? (
            <Image
              src={previewUrl!}
              alt="Foto"
              fill
              unoptimized
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Action buttons — collapse to icons on tight screens */}
        <Button
          type="button"
          size="sm"
          variant={urlMode ? "secondary" : "outline"}
          className="gap-1.5"
          onClick={() => setUrlMode((v) => !v)}
          disabled={disabled}
        >
          <LinkIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">URL</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setUploadOpen(true)}
          disabled={disabled}
        >
          <Upload className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Unggah</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setLibraryOpen(true)}
          disabled={disabled}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Library</span>
        </Button>
        {hasPhoto && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto gap-1.5 text-destructive hover:text-destructive"
            onClick={onClear}
            disabled={disabled}
            aria-label="Hapus foto"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* URL inline input — expands when URL button toggled */}
      {urlMode && (
        <div className="flex items-center gap-2">
          <Input
            type="url"
            placeholder="https://… (paste link gambar)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitUrl();
              } else if (e.key === "Escape") {
                setUrlMode(false);
                setUrlInput("");
              }
            }}
            autoFocus
            disabled={disabled}
          />
          <Button
            type="button"
            size="sm"
            variant="default"
            onClick={submitUrl}
            disabled={disabled || urlInput.trim().length === 0}
            aria-label="Simpan URL"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setUrlMode(false);
              setUrlInput("");
            }}
            aria-label="Batal"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Status hint when photo is set via external URL */}
      {hasPhoto && !hasStorage && (
        <p className="text-xs text-muted-foreground">
          Foto via URL eksternal — pastikan link tetap aktif.
        </p>
      )}

      {/* Upload dialog (drawer on mobile via ResponsiveDialog) */}
      <ResponsiveDialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <ResponsiveDialogContent className="sm:max-w-lg">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Unggah Foto</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Pilih gambar dari perangkat. Otomatis dikonversi ke WebP &amp;
              EXIF dihapus.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <FileUpload
            label=""
            accept="image/*"
            crop={cropAspect ? { aspect: cropAspect } : true}
            hint={uploadHint ?? "JPG/PNG/WebP, maks 10 MB."}
            onUploaded={(r) => {
              onUpload(r);
              setUploadOpen(false);
            }}
          />
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Library picker — already responsive (Drawer on mobile) */}
      <LibraryPicker
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        accept="image"
        onPick={(file) => {
          onPickFromLibrary({ storageId: file.storageId, url: file.url });
          setLibraryOpen(false);
        }}
      />
    </div>
  );
}
