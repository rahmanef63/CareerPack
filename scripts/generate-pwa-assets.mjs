#!/usr/bin/env node
/**
 * Generate every PNG asset the PWA + social-card stack needs, from a
 * single SVG source. Run on-demand — output is committed to
 * frontend/public/ so production serves static files, not Node
 * rendering at request time.
 *
 *   node scripts/generate-pwa-assets.mjs
 *
 * Outputs:
 *   /icons/icon-{72,96,128,144,152,192,256,384,512}.png  — standard
 *   /icons/icon-maskable-512.png                         — Android adaptive
 *   /apple-touch-icon.png                                 — iOS 180×180
 *   /icon.png                                             — 512×512 fallback
 *   /og-image.png                                         — 1200×630 social card
 *   /screenshots/narrow.png                               — 540×1170 for PWA install
 *   /screenshots/wide.png                                 — 1280×720 for PWA install
 *
 * Sharp renders SVG via librsvg → crisp at every size. No external
 * binaries needed (sharp ships its own libvips + librsvg).
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "..", "frontend", "public");

// Brand constants — pulled from tailwind.config.ts brand tokens so the
// PNG gradients match what the user sees in-app. Update both together.
const BRAND_FROM = "#0ea5e9";
const BRAND_TO = "#0369a1";
const BRAND_DEEP = "#075985";

/**
 * Master icon SVG — 1024×1024, no padding. Render this for "any"
 * purpose (browser tabs, favicons, Android non-maskable).
 *
 * The mark: a gradient-filled rounded square, with a stylised career
 * compass — concentric circles (growth) + a pointer line reaching
 * upward-right (progress) inside. Stroke widths are proportional so
 * it stays legible at every size sharp outputs.
 */
function iconSVG(size = 1024) {
  const r = size * 0.22; // rounded-square radius
  const markStroke = size * 0.06;
  const safe = size * 0.14; // margin from canvas edge
  const cx = size / 2;
  const cy = size / 2;
  const outer = size * 0.34;
  const inner = size * 0.18;
  const arrowStart = size * 0.24;
  const arrowEnd = size * 0.74;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BRAND_FROM}"/>
      <stop offset="1" stop-color="${BRAND_TO}"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#bg)"/>
  <rect width="${size}" height="${size / 2}" rx="${r}" ry="${r}" fill="url(#glow)"/>
  <g fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="${markStroke}">
    <circle cx="${cx}" cy="${cy}" r="${outer}"/>
    <circle cx="${cx}" cy="${cy}" r="${inner}"/>
    <path d="M ${arrowStart} ${arrowEnd} L ${arrowEnd} ${arrowStart}"/>
    <path d="M ${arrowEnd} ${arrowStart} L ${arrowEnd - size * 0.18} ${arrowStart} M ${arrowEnd} ${arrowStart} L ${arrowEnd} ${arrowStart + size * 0.18}"/>
  </g>
  <!-- Subtle corner notch to add identity without crowding the mark -->
  <circle cx="${size * 0.12}" cy="${size * 0.12}" r="${size * 0.024}" fill="#ffffff" fill-opacity="0.85"/>
</svg>`;
}

/**
 * Maskable variant — Android might crop the outer 10% of the canvas
 * into a circle/squircle. We keep the mark inside a 70% safe zone
 * (WebApp manifest spec recommends ≥80% but 70% looks more centered
 * in practice on Pixel / Galaxy launcher masks).
 */
function maskableSVG(size = 512) {
  const cx = size / 2;
  const cy = size / 2;
  const safeR = size * 0.35;
  const innerR = size * 0.18;
  const stroke = size * 0.06;
  const arrowStart = cx - size * 0.22;
  const arrowEnd = cx + size * 0.22;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BRAND_FROM}"/>
      <stop offset="1" stop-color="${BRAND_DEEP}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <g fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="${stroke}">
    <circle cx="${cx}" cy="${cy}" r="${safeR}"/>
    <circle cx="${cx}" cy="${cy}" r="${innerR}"/>
    <path d="M ${arrowStart} ${arrowEnd} L ${arrowEnd} ${arrowStart}"/>
    <path d="M ${arrowEnd} ${arrowStart} L ${arrowEnd - size * 0.18} ${arrowStart} M ${arrowEnd} ${arrowStart} L ${arrowEnd} ${arrowStart + size * 0.18}"/>
  </g>
</svg>`;
}

/**
 * Social OG card 1200×630. Logo on left, headline + subhead on right,
 * theme-matched gradient background.
 */
function ogSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0c4a6e"/>
      <stop offset="1" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BRAND_FROM}"/>
      <stop offset="1" stop-color="${BRAND_TO}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="950" cy="120" r="200" fill="${BRAND_FROM}" opacity="0.2"/>
  <circle cx="1050" cy="500" r="260" fill="${BRAND_TO}" opacity="0.2"/>
  <g transform="translate(96 196)">
    <rect width="240" height="240" rx="56" fill="url(#ring)"/>
    <g fill="none" stroke="#ffffff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" transform="translate(120 120)">
      <circle r="80"/>
      <circle r="44"/>
      <path d="M -54 54 L 54 -54"/>
      <path d="M 54 -54 L 8 -54 M 54 -54 L 54 -8"/>
    </g>
  </g>
  <text x="400" y="260" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="74" fill="#f8fafc" letter-spacing="-2">CareerPack</text>
  <text x="400" y="324" font-family="Inter, system-ui, sans-serif" font-weight="500" font-size="30" fill="#cbd5e1" letter-spacing="-0.5">Starter pack lengkap untuk karir Anda</text>
  <g transform="translate(400 380)" font-family="Inter, system-ui, sans-serif" font-size="22" fill="#94a3b8">
    <text x="0" y="0">CV ATS-friendly · Roadmap karir · Ceklis dokumen</text>
    <text x="0" y="34">Asisten AI · Latihan wawancara · Kalkulator keuangan</text>
  </g>
  <rect x="400" y="530" width="128" height="4" fill="url(#ring)" rx="2"/>
</svg>`;
}

/**
 * Narrow screenshot 540×1170 — portrait phone mock of the landing
 * hero. Used in Chrome's richer PWA install prompt.
 */
function screenshotNarrowSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="540" height="1170" viewBox="0 0 540 1170">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e0f2fe"/>
      <stop offset="1" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="540" height="1170" fill="url(#bg)"/>
  <rect x="40" y="80" width="460" height="60" rx="18" fill="${BRAND_FROM}" opacity="0.12"/>
  <text x="60" y="120" font-family="Inter, system-ui" font-weight="600" font-size="22" fill="${BRAND_DEEP}">Perjalanan Karir Anda Dimulai di Sini</text>
  <text x="40" y="220" font-family="Inter, system-ui" font-weight="700" font-size="44" fill="#0f172a">Semua yang Anda</text>
  <text x="40" y="270" font-family="Inter, system-ui" font-weight="700" font-size="44" fill="#0f172a">Butuhkan</text>
  <text x="40" y="340" font-family="Inter, system-ui" font-weight="700" font-size="44" fill="${BRAND_FROM}">Untuk Karir Impian</text>
  <text x="40" y="410" font-family="Inter, system-ui" font-size="20" fill="#475569">Pembuat CV, roadmap skill,</text>
  <text x="40" y="440" font-family="Inter, system-ui" font-size="20" fill="#475569">ceklis dokumen, asisten AI —</text>
  <text x="40" y="470" font-family="Inter, system-ui" font-size="20" fill="#475569">satu paket untuk karir Anda.</text>
  <rect x="40" y="530" width="240" height="64" rx="14" fill="${BRAND_FROM}"/>
  <text x="160" y="571" text-anchor="middle" font-family="Inter, system-ui" font-weight="600" font-size="20" fill="#ffffff">Mulai Gratis</text>
  <rect x="300" y="530" width="200" height="64" rx="14" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="400" y="571" text-anchor="middle" font-family="Inter, system-ui" font-weight="600" font-size="20" fill="#334155">Lihat Demo</text>
  <g transform="translate(40 670)">
    ${[0, 1, 2, 3]
      .map(
        (i) =>
          `<rect x="${i * 118}" y="0" width="108" height="108" rx="24" fill="#ffffff" stroke="#e2e8f0"/>
           <circle cx="${i * 118 + 54}" cy="46" r="22" fill="${BRAND_FROM}" opacity="0.18"/>`,
      )
      .join("")}
    <text x="0" y="160" font-family="Inter, system-ui" font-size="14" fill="#64748b">CV</text>
    <text x="118" y="160" font-family="Inter, system-ui" font-size="14" fill="#64748b">Roadmap</text>
    <text x="236" y="160" font-family="Inter, system-ui" font-size="14" fill="#64748b">Ceklis</text>
    <text x="354" y="160" font-family="Inter, system-ui" font-size="14" fill="#64748b">Wawancara</text>
  </g>
  <rect x="40" y="900" width="460" height="220" rx="24" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="68" y="945" font-family="Inter, system-ui" font-weight="600" font-size="18" fill="#0f172a">Siap dipakai hari ini</text>
  <text x="68" y="975" font-family="Inter, system-ui" font-size="14" fill="#64748b">Data pengguna Anda tersinkronisasi</text>
  <text x="68" y="995" font-family="Inter, system-ui" font-size="14" fill="#64748b">ke semua perangkat secara real-time.</text>
  <rect x="68" y="1030" width="180" height="44" rx="10" fill="${BRAND_FROM}"/>
  <text x="158" y="1058" text-anchor="middle" font-family="Inter, system-ui" font-weight="600" font-size="15" fill="#ffffff">Buka Dashboard</text>
</svg>`;
}

/**
 * Wide screenshot 1280×720 — desktop mock of dashboard.
 */
function screenshotWideSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f0f9ff"/>
      <stop offset="1" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <!-- Sidebar -->
  <rect x="0" y="0" width="240" height="720" fill="#ffffff" stroke="#e2e8f0"/>
  <rect x="20" y="20" width="36" height="36" rx="10" fill="${BRAND_FROM}"/>
  <text x="66" y="44" font-family="Inter, system-ui" font-weight="700" font-size="18" fill="#0f172a">CareerPack</text>
  ${["Dashboard", "CV Saya", "Roadmap", "Ceklis", "Wawancara", "Kalender", "AI"]
    .map(
      (item, i) => `
    <rect x="16" y="${90 + i * 52}" width="208" height="40" rx="10" fill="${i === 0 ? BRAND_FROM : "transparent"}" opacity="${i === 0 ? 0.12 : 1}"/>
    <text x="44" y="${114 + i * 52}" font-family="Inter, system-ui" font-weight="${i === 0 ? 600 : 500}" font-size="14" fill="${i === 0 ? BRAND_DEEP : "#475569"}">${item}</text>`,
    )
    .join("")}
  <!-- Main content -->
  <text x="280" y="64" font-family="Inter, system-ui" font-weight="700" font-size="30" fill="#0f172a">Selamat datang, Budi</text>
  <text x="280" y="94" font-family="Inter, system-ui" font-size="16" fill="#64748b">Berikut ringkasan karir Anda hari ini</text>
  ${[
    { x: 280, y: 130, label: "Skor CV", value: "86", hue: BRAND_FROM },
    { x: 560, y: 130, label: "Progress Roadmap", value: "62%", hue: "#10b981" },
    { x: 840, y: 130, label: "Ceklis Dokumen", value: "8/12", hue: "#f59e0b" },
  ]
    .map(
      (c) => `
    <rect x="${c.x}" y="${c.y}" width="260" height="120" rx="16" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="${c.x + 20}" y="${c.y + 40}" font-family="Inter, system-ui" font-size="13" fill="#64748b">${c.label}</text>
    <text x="${c.x + 20}" y="${c.y + 90}" font-family="Inter, system-ui" font-weight="700" font-size="38" fill="${c.hue}">${c.value}</text>`,
    )
    .join("")}
  <rect x="280" y="280" width="820" height="400" rx="16" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="304" y="316" font-family="Inter, system-ui" font-weight="600" font-size="18" fill="#0f172a">Aktivitas Terbaru</text>
  ${[0, 1, 2, 3, 4]
    .map(
      (i) => `
    <rect x="304" y="${348 + i * 58}" width="40" height="40" rx="10" fill="${BRAND_FROM}" opacity="0.12"/>
    <rect x="364" y="${356 + i * 58}" width="${200 + i * 40}" height="10" rx="4" fill="#1e293b" opacity="0.7"/>
    <rect x="364" y="${374 + i * 58}" width="${120 + i * 24}" height="8" rx="4" fill="#94a3b8"/>`,
    )
    .join("")}
</svg>`;
}

async function svgToPNG(svg, outPath, size, options = {}) {
  await mkdir(dirname(outPath), { recursive: true });
  const pipeline = sharp(Buffer.from(svg));
  if (size) pipeline.resize(size, size, { fit: "contain", background: options.bg || "#ffffff00" });
  const buffer = await pipeline.png().toBuffer();
  await writeFile(outPath, buffer);
  console.log(`  ✓ ${outPath.replace(publicDir + "/", "")} (${buffer.length} B)`);
}

async function svgToPNGCustom(svg, outPath, width, height) {
  await mkdir(dirname(outPath), { recursive: true });
  const buffer = await sharp(Buffer.from(svg))
    .resize(width, height, { fit: "contain" })
    .png()
    .toBuffer();
  await writeFile(outPath, buffer);
  console.log(`  ✓ ${outPath.replace(publicDir + "/", "")} (${buffer.length} B, ${width}×${height})`);
}

async function main() {
  console.log("Generating PWA assets …");
  const iconSizes = [72, 96, 128, 144, 152, 192, 256, 384, 512];
  const master = iconSVG(1024);
  for (const size of iconSizes) {
    await svgToPNG(master, resolve(publicDir, "icons", `icon-${size}.png`), size);
  }
  // Apple touch (rounded corners handled by iOS)
  await svgToPNG(master, resolve(publicDir, "apple-touch-icon.png"), 180);
  // Root fallback
  await svgToPNG(master, resolve(publicDir, "icon.png"), 512);
  // Maskable
  await svgToPNG(
    maskableSVG(512),
    resolve(publicDir, "icons", "icon-maskable-512.png"),
    512,
  );
  // OG / social card
  await svgToPNGCustom(ogSVG(), resolve(publicDir, "og-image.png"), 1200, 630);
  // Screenshots
  await svgToPNGCustom(
    screenshotNarrowSVG(),
    resolve(publicDir, "screenshots", "narrow.png"),
    540,
    1170,
  );
  await svgToPNGCustom(
    screenshotWideSVG(),
    resolve(publicDir, "screenshots", "wide.png"),
    1280,
    720,
  );
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
