#!/usr/bin/env node
/**
 * Copy the pdf.js worker out of node_modules and into frontend/public so it is
 * served from our own origin.
 *
 * It used to load from `https://cdn.jsdelivr.net/npm/pdfjs-dist@<version>/...`,
 * which cannot work in production: the CSP in next.config.ts enumerates exactly
 * which hosts may serve scripts, jsdelivr is not one of them, and there is no
 * `worker-src` directive so the browser falls back to `script-src` and blocks
 * the worker outright. PDF text extraction was dead on careerpack.org — every
 * CV upload fell through to the "scanned image" branch.
 *
 * Copying beats widening the CSP: no third-party origin gains script rights on
 * a page that renders user content, no runtime dependency on a CDN reaching
 * Indonesian networks, and the worker can never drift from the installed API
 * version (a mismatch makes pdf.js throw "The API version does not match the
 * Worker version").
 *
 * Runs from `prebuild` and `predev`, so the copy is always in step with
 * whatever pnpm resolved.
 */
import { createRequire } from "node:module";
import { cpSync, copyFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "frontend", "public");

let workerSrc;
try {
  // Resolve through the package so this follows pnpm's actual layout rather
  // than a guessed node_modules path.
  workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.min.mjs", {
    paths: [join(root, "frontend")],
  });
} catch {
  console.error(
    "[pdf-worker] pdfjs-dist not installed — run `pnpm install` first.",
  );
  process.exit(1);
}
const pkgRoot = join(dirname(workerSrc), "..", "..");

mkdirSync(publicDir, { recursive: true });
copyFileSync(workerSrc, join(publicDir, "pdf.worker.min.mjs"));
console.log(
  `[pdf-worker] ${(statSync(join(publicDir, "pdf.worker.min.mjs")).size / 1024).toFixed(0)} KB -> public/pdf.worker.min.mjs`,
);

/**
 * Font + encoding data pdf.js fetches on demand.
 *
 * `standard_fonts/` covers the base-14 faces (Helvetica, Times, Courier…)
 * that a PDF is allowed to reference WITHOUT embedding — plenty of generators
 * do exactly that. `cmaps/` covers documents whose text uses a named character
 * encoding rather than a simple one.
 *
 * Neither is bundled: pdf.js requests a single file only when a document
 * actually needs it, so the cost is disk, not page weight. Without them
 * pdf.js warns "Ensure that the standardFontDataUrl API parameter is
 * provided" and falls back to substitutes — tolerable when we only want the
 * text layer, but the OCR path RASTERISES pages and ships the image to a
 * vision model, so a substituted font is a page of wrong glyphs.
 */
for (const dir of ["standard_fonts", "cmaps"]) {
  const from = join(pkgRoot, dir);
  cpSync(from, join(publicDir, dir), { recursive: true });
  console.log(`[pdf-worker] ${dir}/ -> public/${dir}/`);
}
