/**
 * Browser-side CV ingestion: get a PDF or a photo into something
 * `api.ai.resume.parseResume` can read.
 *
 * Two routes. A PDF with a real text layer costs nothing to read, so we
 * always try that first. A scanned PDF has no text layer at all, and the only
 * way to read it is to rasterise the pages and spend an AI vision call — so
 * that route is NEVER taken automatically. `extractCv` reports the verdict
 * and the UI asks the user, because the escalation costs them quota.
 *
 * `assessExtraction` and `normalizeExtractedText` are pure and unit-tested;
 * everything below them needs a canvas and is verified by hand.
 */

import { convertImageToWebP, isConvertibleImage, MAX_EDGE } from "./imageConvert";

/** A4 at 1400 px on the long edge is ~169 DPI, over the ~150 DPI floor where
 *  text OCR starts failing. */
export const OCR_MAX_EDGE = MAX_EDGE.ocrPage;
export const OCR_QUALITY = 0.75;
export const OCR_MAX_PAGES = 3;
/** Base64 budget for the whole request. Anthropic (via OpenRouter) caps a
 *  single image at 5 MB, and the action rejects anything over 4 MB total. */
export const OCR_MAX_TOTAL_B64 = 3.5 * 1024 * 1024;

/** Text-layer page cap. Only bounds work on a pathological document — the
 *  AI action truncates the text itself. */
const TEXT_MAX_PAGES = 30;

export type ExtractionVerdict = "good" | "thin" | "garbage";

export interface ExtractResult {
  kind: "text" | "images";
  text?: string;
  /** `data:image/webp;base64,…`, one per page. */
  pages?: string[];
  pageCount: number;
  truncatedPages: boolean;
  /** Text route only. Anything but `"good"` means the PDF is probably a scan
   *  and the caller should offer the OCR escalation instead of parsing. */
  verdict?: ExtractionVerdict;
}

/**
 * Is this text worth sending to the parser, or is it the residue of a scanned
 * page? Length alone is not enough — a scan of a design-heavy CV yields
 * kilobytes of ligature junk, and a one-page PDF of real text is short.
 */
export function assessExtraction(text: string): {
  verdict: ExtractionVerdict;
  chars: number;
  alphaRatio: number;
} {
  const letters = (text.match(/[A-Za-z\u00C0-\u024F]/g) ?? []).length;
  const nonWs = text.replace(/\s/g, "").length;
  const alphaRatio = nonWs === 0 ? 0 : letters / nonWs;
  const hasYear = /\b(19|20)\d{2}\b/.test(text);
  const hasEmail = /[^\s@]+@[^\s@]+\.[^\s@]{2,}/.test(text);

  const verdict: ExtractionVerdict =
    alphaRatio < 0.55 && nonWs > 0
      ? "garbage"
      : text.length < 200 || (!hasYear && !hasEmail)
        ? "thin"
        : "good";
  return { verdict, chars: text.length, alphaRatio };
}

/** Collapse the runs of spaces pdfjs emits between glyph runs while keeping
 *  the line breaks — a CV read as one long line loses the boundary between a
 *  job title and the next employer. */
export function normalizeExtractedText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Lazy-load pdfjs-dist on first use. The legacy build is Node + browser
 * compatible with no top-level worker dependency, so it stays out of the
 * main bundle until somebody actually imports a CV.
 */
async function loadPdfjs() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore — pdfjs-dist legacy build lacks DT for this entry point.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Inline worker so we don't have to copy worker file into /public.
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    // Same origin, copied out of node_modules by scripts/copy-pdf-worker.mjs.
    // This was a jsdelivr URL, which the CSP blocks: script-src enumerates the
    // allowed hosts and jsdelivr is not among them, and with no worker-src
    // directive the browser falls back to script-src. Every PDF upload in
    // production therefore produced zero text and fell through to the
    // scanned-image branch.
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
  return pdfjs;
}

function itemText(item: unknown): string {
  if (!item || typeof item !== "object") return "";
  const { str, hasEOL } = item as { str?: unknown; hasEOL?: unknown };
  if (typeof str !== "string") return "";
  // pdfjs reports the line break per text item; without it every page
  // collapses into a single line and the parser loses the record boundaries.
  return str + (hasEOL === true ? "\n" : " ");
}

async function readPdfText(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<{ text: string; pageCount: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const total = Math.min(doc.numPages, TEXT_MAX_PAGES);
  const pages: string[] = [];
  for (let p = 1; p <= total; p++) {
    onProgress?.(p, total);
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    pages.push(content.items.map(itemText).join(""));
  }
  return { text: normalizeExtractedText(pages.join("\n\n")), pageCount: total };
}

/** Text layer of a PDF, line structure preserved. Empty when the PDF is a
 *  scan — see `assessExtraction`. */
export async function extractPdfText(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<string> {
  return (await readPdfText(file, onProgress)).text;
}

/**
 * Render the first `OCR_MAX_PAGES` pages to WebP data URLs for the vision
 * model. Costs the user a quota slot downstream, so only call this after they
 * have explicitly asked for it.
 */
export async function rasterizePdfPages(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const total = Math.min(doc.numPages, OCR_MAX_PAGES);
  const pages: string[] = [];

  for (let p = 1; p <= total; p++) {
    onProgress?.(p, total);
    const page = await doc.getPage(p);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({
      scale: Math.min(OCR_MAX_EDGE / Math.max(base.width, base.height), 4),
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas tidak tersedia di browser ini");
    await page.render({ canvasContext: ctx, canvas, viewport }).promise;
    pages.push(canvas.toDataURL("image/webp", OCR_QUALITY));
    // Release the backing store immediately — three A4 canvases at 1400 px
    // is ~33 MB of RGBA that a mid-range phone will not spare.
    canvas.width = 0;
    canvas.height = 0;
  }

  while (pages.length > 1 && pages.join("").length > OCR_MAX_TOTAL_B64) {
    pages.pop();
  }
  return pages;
}

export async function fileToDataUrl(file: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Gagal membaca file gambar"));
    };
    reader.onerror = () => reject(new Error("Gagal membaca file gambar"));
    reader.readAsDataURL(file);
  });
}

/**
 * Route an uploaded CV to the cheapest readable form. A PDF whose verdict is
 * not `"good"` still comes back as `kind: "text"` — the caller decides
 * whether to escalate to `rasterizePdfPages`, because that spends quota.
 */
export async function extractCv(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<ExtractResult> {
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    const { text, pageCount } = await readPdfText(file, onProgress);
    const { verdict } = assessExtraction(text);
    return { kind: "text", text, pageCount, truncatedPages: false, verdict };
  }

  if (isConvertibleImage(file.type)) {
    onProgress?.(1, 1);
    const webp = await convertImageToWebP(file, OCR_MAX_EDGE);
    const dataUrl = await fileToDataUrl(webp);
    return { kind: "images", pages: [dataUrl], pageCount: 1, truncatedPages: false };
  }

  throw new Error("Format tidak didukung. Unggah PDF atau foto CV (JPG/PNG).");
}
