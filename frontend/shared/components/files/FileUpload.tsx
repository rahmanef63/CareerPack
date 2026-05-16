"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Cropper, { type Area } from "react-easy-crop";
import { notify } from "@/shared/lib/notify";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Loader2,
  AlertCircle,
  Crop as CropIcon,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Slider } from "@/shared/components/ui/slider";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
} from "@/shared/components/ui/responsive-dialog";
import { cn } from "@/shared/lib/utils";
import {
  useFileUpload,
  validateFile,
  formatFileSize,
  ALL_ALLOWED_TYPES,
  type UploadResult,
} from "@/shared/hooks/useFileUpload";
import {
  applyCropToImage,
  describeConversion,
  isConvertibleImage,
} from "@/shared/lib/imageConvert";
import type { Id } from "../../../../../convex/_generated/dataModel";

export interface FileUploadResult {
  storageId: string;
  fileId: Id<"files">;
  fileName: string;
  fileType: string;
  fileSize: number;
  originalSize: number;
}

export interface FileUploadProps {
  onUploaded?: (result: FileUploadResult) => void;
  onCleared?: () => void;
  /** Override HTML accept; defaults to all converter-supported MIMEs. */
  accept?: string;
  /** Label shown above the drop zone. */
  label?: string;
  /** Helper text shown below the icon. */
  hint?: string;
  /**
   * Enable crop dialog before upload. `true` = free crop; object =
   * aspect-locked (e.g. `{ aspect: 1 }` for square avatars).
   * PDFs skip the crop step regardless.
   */
  crop?: boolean | { aspect?: number };
  disabled?: boolean;
  className?: string;
}

type LocalState =
  | { kind: "idle" }
  | {
      kind: "uploading";
      previewUrl: string | null;
      fileName: string;
      fileType: string;
      fileSize: number;
    }
  | {
      kind: "done";
      previewUrl: string | null;
      result: FileUploadResult;
    };

const DEFAULT_ACCEPT = ALL_ALLOWED_TYPES.join(",");

export function FileUpload({
  onUploaded,
  onCleared,
  accept = DEFAULT_ACCEPT,
  label = "Unggah file",
  hint = "Tarik dan lepas, atau klik untuk pilih file. Gambar (JPG/PNG/WebP) dikonversi ke WebP otomatis (maks 10 MB). PDF maks 50 MB.",
  crop,
  disabled = false,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading, error, progress } = useFileUpload();
  const [state, setState] = useState<LocalState>({ kind: "idle" });
  const [isDragging, setIsDragging] = useState(false);

  // Crop dialog state — source file + blob URL + area tracking.
  const [cropSource, setCropSource] = useState<{
    file: File;
    url: string;
  } | null>(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPixels, setCropPixels] = useState<Area | null>(null);

  const cropAspect =
    typeof crop === "object" && crop?.aspect ? crop.aspect : undefined;

  useEffect(() => {
    const url =
      state.kind === "uploading" || state.kind === "done"
        ? state.previewUrl
        : null;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [state]);

  useEffect(() => {
    return () => {
      if (cropSource) URL.revokeObjectURL(cropSource.url);
    };
  }, [cropSource]);

  const runUpload = useCallback(
    async (file: File) => {
      const isImg = file.type.startsWith("image/");
      const previewUrl = isImg ? URL.createObjectURL(file) : null;
      setState({
        kind: "uploading",
        previewUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      const result: UploadResult = await upload(file);
      if (!result.ok) {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setState({ kind: "idle" });
        notify.error("Unggah gagal", { description: result.error });
        return;
      }

      const { ok: _ok, ...payload } = result;
      void _ok;
      setState({ kind: "done", previewUrl, result: payload });

      const desc =
        payload.originalSize > payload.fileSize
          ? describeConversion(payload.originalSize, payload.fileSize)
          : `${payload.fileName} (${formatFileSize(payload.fileSize)})`;
      notify.success("File terunggah", { description: desc });
      onUploaded?.(payload);
    },
    [upload, onUploaded],
  );

  const handleFile = useCallback(
    async (file: File) => {
      const pre = validateFile(file);
      if (!pre.ok) {
        notify.error("File tidak valid", { description: pre.error });
        return;
      }

      // Crop path — only when crop opted in AND the file is a
      // convertible image (PDFs never crop).
      if (crop && isConvertibleImage(file.type)) {
        const url = URL.createObjectURL(file);
        setCropSource({ file, url });
        setCropArea({ x: 0, y: 0 });
        setCropZoom(1);
        setCropPixels(null);
        return;
      }

      await runUpload(file);
    },
    [crop, runUpload],
  );

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCropPixels(pixels);
  }, []);

  const confirmCrop = async () => {
    if (!cropSource || !cropPixels) return;
    try {
      const cropped = await applyCropToImage(cropSource.file, {
        x: cropPixels.x,
        y: cropPixels.y,
        width: cropPixels.width,
        height: cropPixels.height,
      });
      URL.revokeObjectURL(cropSource.url);
      setCropSource(null);
      await runUpload(cropped);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal memotong gambar";
      notify.error("Crop gagal", { description: msg });
    }
  };

  const cancelCrop = () => {
    if (cropSource) URL.revokeObjectURL(cropSource.url);
    setCropSource(null);
  };

  const onBrowse = () => {
    if (disabled || isUploading) return;
    inputRef.current?.click();
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || isUploading) return;
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const clear = () => {
    setState({ kind: "idle" });
    onCleared?.();
  };

  // ------------------------------------------------------------
  // render
  // ------------------------------------------------------------

  if (state.kind === "done") {
    const { result, previewUrl } = state;
    const isImg = result.fileType.startsWith("image/");
    const savings =
      result.originalSize > result.fileSize
        ? describeConversion(result.originalSize, result.fileSize)
        : null;
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-card p-3 flex items-start gap-3",
          className,
        )}
      >
        {isImg && previewUrl ? (
          <Image
            src={previewUrl}
            alt={result.fileName}
            width={80}
            height={80}
            unoptimized
            className="w-20 h-20 rounded-lg object-cover border border-border flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-foreground">
            {result.fileName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatFileSize(result.fileSize)} ·{" "}
            {result.fileType.split("/")[1]?.toUpperCase() ?? result.fileType}
          </p>
          {savings && (
            <p className="text-xs text-success mt-1 truncate">{savings}</p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          aria-label="Hapus file"
          className="flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <button
        type="button"
        onClick={onBrowse}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        disabled={disabled || isUploading}
        aria-label={label}
        className={cn(
          "w-full rounded-xl border-2 border-dashed px-6 py-8 transition-colors text-center",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isDragging
            ? "border-brand bg-brand-muted/40"
            : "border-border bg-muted/30 hover:border-brand/60 hover:bg-muted/50",
          (disabled || isUploading) && "opacity-60 cursor-not-allowed",
          !(disabled || isUploading) && "cursor-pointer",
        )}
      >
        <div className="flex flex-col items-center gap-2">
          {state.kind === "uploading" ? (
            <>
              <Loader2 className="w-8 h-8 text-brand animate-spin" />
              <p className="text-sm font-medium text-foreground">
                Mengunggah {state.fileName}…
              </p>
              <div className="w-full max-w-xs space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-brand transition-[width] duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {progress}% · {formatFileSize(state.fileSize)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-brand-muted flex items-center justify-center">
                {accept.includes("image") ? (
                  <ImageIcon className="w-6 h-6 text-brand" />
                ) : (
                  <Upload className="w-6 h-6 text-brand" />
                )}
              </div>
              <p className="text-sm font-medium text-foreground">
                Klik atau tarik file ke sini
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">{hint}</p>
            </>
          )}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onInputChange}
        className="hidden"
        aria-hidden
      />

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Crop dialog — mounted only while a crop is in progress. */}
      <Dialog
        open={cropSource !== null}
        onOpenChange={(open) => {
          if (!open) cancelCrop();
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CropIcon className="w-4 h-4 text-brand" />
              Atur crop gambar
            </DialogTitle>
            <DialogDescription>
              Geser, zoom, lalu konfirmasi. Hasil akan dikonversi ke WebP
              {cropAspect ? ` dengan rasio ${cropAspect.toFixed(2)}` : ""}.
            </DialogDescription>
          </DialogHeader>
          {cropSource && (
            <div className="space-y-4">
              <div className="relative h-[320px] w-full bg-muted rounded-lg overflow-hidden">
                <Cropper
                  image={cropSource.url}
                  crop={cropArea}
                  zoom={cropZoom}
                  aspect={cropAspect}
                  onCropChange={setCropArea}
                  onZoomChange={setCropZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Zoom: {cropZoom.toFixed(2)}×
                </label>
                <Slider
                  value={[cropZoom]}
                  onValueChange={([z]) => setCropZoom(z)}
                  min={1}
                  max={3}
                  step={0.01}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={cancelCrop}>
              Batal
            </Button>
            <Button
              onClick={confirmCrop}
              disabled={!cropPixels}
              className="bg-brand hover:bg-brand"
            >
              Terapkan &amp; unggah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
