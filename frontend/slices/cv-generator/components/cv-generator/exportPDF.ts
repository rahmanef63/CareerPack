import { notify } from "@/shared/lib/notify";
import type { CVData } from "../../types";
import type { PreviewLayout } from "../../hooks/usePreviewControls";

interface ExportArgs {
  node: HTMLDivElement;
  cvData: CVData;
  /**
   * Layout the preview is currently showing — drives PDF page shape.
   * `paginated` (default) = classic A4 multi-page; `long` = single
   * page sized to content height so the PDF reads as one continuous
   * scroll (useful for web share / Notion attach / printer-less).
   */
  layout?: PreviewLayout;
}

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/**
 * Render the CV preview node to a PDF and trigger download.
 * Uses html2canvas-pro (fork) — original html2canvas crashes on modern
 * CSS color functions (oklch / lab / lch / color()) which every shadcn +
 * theme token in the preview resolves to.
 *
 * Two layouts share the same capture + scale pipeline:
 *   - `paginated`: A4 multi-page; image slides up by pageH each step.
 *   - `long`: single page sized to content (210 mm wide × {content} mm tall).
 *     Filename suffixed with `-1hal` so users can tell at a glance.
 */
export async function exportCVToPDF({
  node,
  cvData,
  layout = "paginated",
}: ExportArgs) {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ]);

  const safeName =
    (cvData.profile.name || 'cv')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'cv';

  // Fonts must be resolved before capture: html2canvas re-measures glyph
  // metrics in its clone, and a fallback face swapping mid-capture shifts
  // every text run. document.fonts.ready settles once web fonts are live.
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* fonts.ready never rejects in practice; ignore just in case */
    }
  }

  // The capture node lives INSIDE ScaledCVPreview's `transform: scale(s)`
  // wrapper (transformOrigin: top center) — and, mid-swipe, a second
  // `transform: translateX(...)` wrapper in the dialog. html2canvas paints
  // text glyphs at the natural font size but positions every box/line from
  // the *scaled* getBoundingClientRect, so at any scale < 1 the lines pile
  // onto each other ("tumpang tindih"). The on-screen preview looks fine
  // because the browser scales text + layout together. Fix: capture at the
  // natural, untransformed box (offsetWidth/offsetHeight ignore ancestor
  // transforms) and strip the transforms off the clone's ancestors in
  // onclone — html2canvas-pro re-reads the crop bounds from the *cloned*
  // node AFTER onclone runs, so the un-scaled clone drives both layout and
  // crop position. scale:3 stays for print DPI.
  const naturalWidth = node.offsetWidth || 794;
  const naturalHeight = node.offsetHeight;

  const canvas = await html2canvas(node, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: naturalWidth,
    height: naturalHeight,
    windowWidth: 794,
    windowHeight: naturalHeight,
    onclone: (_doc: Document, clonedNode: HTMLElement) => {
      // Walk the clone's ancestor chain up to <html>, neutralising the
      // preview's scale/translate transforms and any clipping so the cloned
      // subtree lays out 1:1 at natural A4 width.
      let el: HTMLElement | null = clonedNode;
      while (el) {
        el.style.transform = 'none';
        el.style.overflow = 'visible';
        el.style.overflowWrap = 'normal';
        el.style.wordBreak = 'normal';
        el.style.maxHeight = 'none';
        el.style.maxWidth = 'none';
        el = el.parentElement;
      }
    },
  });

  // 0.96 — a CV is high-contrast text; lower JPEG quality adds visible
  // ringing/halo around glyphs that isn't in the on-screen preview.
  const imgData = canvas.toDataURL('image/jpeg', 0.96);
  const imgW = A4_WIDTH_MM;
  const imgH = (canvas.height * imgW) / canvas.width;

  // Max single-page height (mm) — beyond this we paginate instead so a
  // very long CV isn't silently clipped (previously pageH was clamped to
  // 5000 but the image was still drawn at its full imgH, cutting the tail).
  const LONG_MAX_MM = 5000;
  if (layout === "long" && imgH <= LONG_MAX_MM) {
    // Single-page PDF whose height matches the content exactly. Min bound at
    // A4 height so very short CVs don't end up as awkward post-it slips.
    const pageH = Math.max(A4_HEIGHT_MM, imgH);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [A4_WIDTH_MM, pageH],
      compress: true,
    });
    pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
    pdf.save(`cv-${safeName}-1hal.pdf`);
    notify.success('PDF satu halaman berhasil diunduh');
    return;
  }

  // Templates render at exactly A4 width (210 mm) so the canvas maps
  // straight onto the page edge-to-edge. Long CVs paginate by sliding
  // the image up by pageH each step.
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  let heightLeft = imgH;
  let y = 0;
  pdf.addImage(imgData, 'JPEG', 0, y, pageW, imgH);
  heightLeft -= pageH;

  // 3 mm threshold — avoids spawning a near-blank page when the captured
  // canvas overshoots A4 by rounding noise (would show as a sliver page).
  while (heightLeft > 3) {
    pdf.addPage();
    y = -(imgH - heightLeft);
    pdf.addImage(imgData, 'JPEG', 0, y, pageW, imgH);
    heightLeft -= pageH;
  }

  pdf.save(`cv-${safeName}.pdf`);
  notify.success('PDF berhasil diunduh');
}
