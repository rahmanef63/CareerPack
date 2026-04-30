import { notify } from "@/shared/lib/notify";
import type { CVData } from "../../types";

interface ExportArgs {
  node: HTMLDivElement;
  cvData: CVData;
}

/**
 * Render the CV preview node to a paginated A4 PDF and trigger download.
 * Uses html2canvas-pro (fork) — original html2canvas crashes on modern
 * CSS color functions (oklch / lab / lch / color()) which every shadcn +
 * theme token in the preview resolves to. scale=3 ≈ 288dpi capture, jpeg
 * 0.92 keeps typical CVs under 1 MB.
 */
export async function exportCVToPDF({ node, cvData }: ExportArgs) {
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

  // Templates render at exactly A4 width (210 mm) so the canvas maps
  // straight onto the page edge-to-edge — no margin band. Long CVs
  // paginate by sliding the image up by pageH each step.
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;
  const imgData = canvas.toDataURL('image/jpeg', 0.92);

  let heightLeft = imgH;
  let y = 0;
  pdf.addImage(imgData, 'JPEG', 0, y, imgW, imgH);
  heightLeft -= pageH;

  // 3 mm threshold — avoids spawning a near-blank page when the captured
  // canvas overshoots A4 by rounding noise (would show as a sliver page).
  while (heightLeft > 3) {
    pdf.addPage();
    y = -(imgH - heightLeft);
    pdf.addImage(imgData, 'JPEG', 0, y, imgW, imgH);
    heightLeft -= pageH;
  }

  pdf.save(`cv-${safeName}.pdf`);
  notify.success('PDF berhasil diunduh');
}
