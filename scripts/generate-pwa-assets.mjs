#!/usr/bin/env node
/**
 * Regenerate the PWA + social PNGs FROM the shipped brand assets in
 * frontend/public/brand + frontend/public/og. Output is committed so
 * production serves static files, not Node rendering at request time.
 *
 *   node scripts/generate-pwa-assets.mjs
 *
 * Sources → outputs (all paths under frontend/public/):
 *   brand/icon-512.png          → icons/icon-{72..512}.png, icon.png
 *   brand/icon-maskable-512.png → icons/icon-maskable-512.png
 *   brand/apple-touch-icon.png  → apple-touch-icon.png
 *   og/og-light.jpg             → og-image.png (legacy 1200×630 URL)
 *   (inline SVG)                → screenshots/{narrow,wide}.png
 *
 * ponytail: screenshots are still drawn here — no real screenshot assets
 * exist yet. Everything else is a straight resize/copy of the real brand.
 */

import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "..", "frontend", "public");
const brand = (file) => resolve(publicDir, "brand", file);
const rel = (p) => p.replace(publicDir + "/", "");

// Brand palette — matches frontend/public/manifest.webmanifest.
const BRAND_BLUE = "#2563FF";
const BRAND_NAVY = "#0B1F5C";

/**
 * Narrow screenshot 540×1170 — portrait phone mock of the landing
 * hero. Used in Chrome's richer PWA install prompt.
 */
function screenshotNarrowSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="540" height="1170" viewBox="0 0 540 1170">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e8eeff"/>
      <stop offset="1" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="540" height="1170" fill="url(#bg)"/>
  <rect x="40" y="80" width="460" height="60" rx="18" fill="${BRAND_BLUE}" opacity="0.12"/>
  <text x="60" y="120" font-family="Inter, system-ui" font-weight="600" font-size="22" fill="${BRAND_NAVY}">Perjalanan Karir Anda Dimulai di Sini</text>
  <text x="40" y="220" font-family="Inter, system-ui" font-weight="700" font-size="44" fill="#0f172a">Semua yang Anda</text>
  <text x="40" y="270" font-family="Inter, system-ui" font-weight="700" font-size="44" fill="#0f172a">Butuhkan</text>
  <text x="40" y="340" font-family="Inter, system-ui" font-weight="700" font-size="44" fill="${BRAND_BLUE}">Untuk Karir Impian</text>
  <text x="40" y="410" font-family="Inter, system-ui" font-size="20" fill="#475569">Pembuat CV, roadmap skill,</text>
  <text x="40" y="440" font-family="Inter, system-ui" font-size="20" fill="#475569">ceklis dokumen, asisten AI —</text>
  <text x="40" y="470" font-family="Inter, system-ui" font-size="20" fill="#475569">satu paket untuk karir Anda.</text>
  <rect x="40" y="530" width="240" height="64" rx="14" fill="${BRAND_BLUE}"/>
  <text x="160" y="571" text-anchor="middle" font-family="Inter, system-ui" font-weight="600" font-size="20" fill="#ffffff">Mulai Gratis</text>
  <rect x="300" y="530" width="200" height="64" rx="14" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="400" y="571" text-anchor="middle" font-family="Inter, system-ui" font-weight="600" font-size="20" fill="#334155">Lihat Demo</text>
  <g transform="translate(40 670)">
    ${[0, 1, 2, 3]
      .map(
        (i) =>
          `<rect x="${i * 118}" y="0" width="108" height="108" rx="24" fill="#ffffff" stroke="#e2e8f0"/>
           <circle cx="${i * 118 + 54}" cy="46" r="22" fill="${BRAND_BLUE}" opacity="0.18"/>`,
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
  <rect x="68" y="1030" width="180" height="44" rx="10" fill="${BRAND_BLUE}"/>
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
      <stop offset="0" stop-color="#f2f5ff"/>
      <stop offset="1" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <!-- Sidebar -->
  <rect x="0" y="0" width="240" height="720" fill="#ffffff" stroke="#e2e8f0"/>
  <rect x="20" y="20" width="36" height="36" rx="10" fill="${BRAND_BLUE}"/>
  <text x="66" y="44" font-family="Inter, system-ui" font-weight="700" font-size="18" fill="#0f172a">CareerPack</text>
  ${["Dashboard", "CV Saya", "Roadmap", "Ceklis", "Wawancara", "Kalender", "AI"]
    .map(
      (item, i) => `
    <rect x="16" y="${90 + i * 52}" width="208" height="40" rx="10" fill="${i === 0 ? BRAND_BLUE : "transparent"}" opacity="${i === 0 ? 0.12 : 1}"/>
    <text x="44" y="${114 + i * 52}" font-family="Inter, system-ui" font-weight="${i === 0 ? 600 : 500}" font-size="14" fill="${i === 0 ? BRAND_NAVY : "#475569"}">${item}</text>`,
    )
    .join("")}
  <!-- Main content -->
  <text x="280" y="64" font-family="Inter, system-ui" font-weight="700" font-size="30" fill="#0f172a">Selamat datang, Budi</text>
  <text x="280" y="94" font-family="Inter, system-ui" font-size="16" fill="#64748b">Berikut ringkasan karir Anda hari ini</text>
  ${[
    { x: 280, y: 130, label: "Skor CV", value: "86", hue: BRAND_BLUE },
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
    <rect x="304" y="${348 + i * 58}" width="40" height="40" rx="10" fill="${BRAND_BLUE}" opacity="0.12"/>
    <rect x="364" y="${356 + i * 58}" width="${200 + i * 40}" height="10" rx="4" fill="#1e293b" opacity="0.7"/>
    <rect x="364" y="${374 + i * 58}" width="${120 + i * 24}" height="8" rx="4" fill="#94a3b8"/>`,
    )
    .join("")}
</svg>`;
}

async function emit(buffer, outPath, note = "") {
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, buffer);
  console.log(`  ✓ ${rel(outPath)} (${buffer.length} B${note})`);
}

async function resizePNG(src, outPath, width, height = width) {
  const buffer = await sharp(src)
    .resize(width, height, { fit: "contain", background: "#ffffff00" })
    .png()
    .toBuffer();
  await emit(buffer, outPath, `, ${width}×${height}`);
}

async function copyAsIs(src, outPath) {
  await mkdir(dirname(outPath), { recursive: true });
  await copyFile(src, outPath);
  console.log(`  ✓ ${rel(outPath)} (copied from ${rel(src)})`);
}

async function main() {
  console.log("Generating PWA assets from frontend/public/brand …");
  const master = brand("icon-512.png");
  for (const size of [72, 96, 128, 144, 152, 192, 256, 384]) {
    await resizePNG(master, resolve(publicDir, "icons", `icon-${size}.png`), size);
  }
  await copyAsIs(master, resolve(publicDir, "icons", "icon-512.png"));
  await copyAsIs(master, resolve(publicDir, "icon.png"));
  await copyAsIs(
    brand("icon-maskable-512.png"),
    resolve(publicDir, "icons", "icon-maskable-512.png"),
  );
  await copyAsIs(brand("apple-touch-icon.png"), resolve(publicDir, "apple-touch-icon.png"));

  // Legacy /og-image.png URL kept alive, repointed at the real social card.
  // ponytail: palette PNG — the card is a JPEG, so a truecolour re-encode
  // triples the byte count for a URL the app no longer links to.
  const og = await sharp(resolve(publicDir, "og", "og-light.jpg"))
    .resize(1200, 630, { fit: "cover" })
    .png({ palette: true, quality: 90, effort: 10 })
    .toBuffer();
  await emit(og, resolve(publicDir, "og-image.png"), ", 1200×630");

  for (const [svg, name, w, h] of [
    [screenshotNarrowSVG(), "narrow.png", 540, 1170],
    [screenshotWideSVG(), "wide.png", 1280, 720],
  ]) {
    const buffer = await sharp(Buffer.from(svg))
      .resize(w, h, { fit: "contain" })
      .png()
      .toBuffer();
    await emit(buffer, resolve(publicDir, "screenshots", name), `, ${w}×${h}`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
