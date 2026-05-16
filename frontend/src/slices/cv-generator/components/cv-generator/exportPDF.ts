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

  const canvas = await html2canvas(node, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const imgW = A4_WIDTH_MM;
  const imgH = (canvas.height * imgW) / canvas.width;

  if (layout === "long") {
    // Single-page PDF whose height matches the content exactly. Min
    // bound at A4 height so very short CVs don't end up as awkward
    // post-it slips; max bound at 5000 mm so we don't generate a 50 m
    // monstrosity if the user pastes a novel.
    const pageH = Math.max(A4_HEIGHT_MM, Math.min(imgH, 5000));
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
