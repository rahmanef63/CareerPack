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
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "frontend", "public", "pdf.worker.min.mjs");

let src;
try {
  // Resolve through the package so this follows pnpm's actual layout rather
  // than a guessed node_modules path.
  src = require.resolve("pdfjs-dist/legacy/build/pdf.worker.min.mjs", {
    paths: [join(root, "frontend")],
  });
} catch {
  console.error(
    "[pdf-worker] pdfjs-dist not installed — run `pnpm install` first.",
  );
  process.exit(1);
}

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log(
  `[pdf-worker] ${(statSync(dest).size / 1024).toFixed(0)} KB -> frontend/public/pdf.worker.min.mjs`,
);
