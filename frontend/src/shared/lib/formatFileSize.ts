/**
 * Human-readable byte-size formatter — single source of truth.
 *
 * Uses Indonesian decimal separator (comma, e.g. "1,23 MB") for all
 * units above bytes. Rolls up through KB/MB/GB so AdminPanel storage
 * totals (multiple GB) and FileUpload per-file sizes (typically < 10
 * MB) share one formatter.
 *
 * Before this, AdminPanel had its own `formatBytes` and useFileUpload
 * had its own `formatFileSize` with slightly different rounding +
 * unit ceilings. This unifies both.
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1).replace(".", ",")} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2).replace(".", ",")} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2).replace(".", ",")} GB`;
}

/**
 * Compression delta: "3,4 MB → 1,1 MB (−68%)". Used by the file
 * upload UI to show the WebP conversion win.
 */
export function describeConversion(
  originalBytes: number,
  convertedBytes: number,
): string {
  if (originalBytes <= 0) return formatFileSize(convertedBytes);
  const delta = Math.round(
    ((originalBytes - convertedBytes) / originalBytes) * 100,
  );
  const sign = delta >= 0 ? "−" : "+";
  return `${formatFileSize(originalBytes)} → ${formatFileSize(convertedBytes)} (${sign}${Math.abs(delta)}%)`;
}
