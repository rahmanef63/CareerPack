/**
 * The single allowlist for anything entering the Content Library.
 *
 * Extracted so the MCP upload path cannot drift from the app's. It nearly did:
 * a first pass at the MCP tools listed png/jpeg/gif/avif, which reads as
 * reasonable until you notice this app converts every image to WebP before
 * upload (see `frontend/shared/lib/imageCompress.ts` and the auto-WebP work)
 * — so a wider list here would have let one entry point seed the library with
 * formats every other part of the product assumes are not there.
 *
 * Images are WebP-only ON PURPOSE. If that ever changes it changes here, once,
 * for every writer.
 */

export const ALLOWED_IMAGE_TYPES = new Set(["image/webp"]);
export const ALLOWED_DOC_TYPES = new Set(["application/pdf"]);

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_DOC_BYTES = 50 * 1024 * 1024;

/** Throws an Indonesian message on anything not allowed — the string reaches
 *  the user in the app and the model over MCP, so it has to read as guidance. */
export function assertAllowedFile(fileType: string, fileSize: number) {
  if (ALLOWED_IMAGE_TYPES.has(fileType)) {
    if (fileSize > MAX_IMAGE_BYTES) {
      throw new Error("Gambar terlalu besar (maks 10 MB)");
    }
    return;
  }
  if (ALLOWED_DOC_TYPES.has(fileType)) {
    if (fileSize > MAX_DOC_BYTES) {
      throw new Error("Dokumen terlalu besar (maks 50 MB)");
    }
    return;
  }
  throw new Error(
    "Tipe file tidak didukung. Gambar harus image/webp, dokumen harus application/pdf.",
  );
}
