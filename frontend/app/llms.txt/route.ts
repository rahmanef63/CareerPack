import { api } from "../../../convex/_generated/api";
import { publicContentList } from "@/shared/lib/publicContentQuery";

/**
 * /llms.txt — the llms.txt convention (H1, one-line `>` summary, a short prose
 * paragraph, then `##` sections of markdown links) so an LLM crawling the site
 * gets a clean map of the public surface instead of scraping React output.
 *
 * GENERATED, never hand-written: the two content sections come from the same
 * Convex queries the public pages read (`listPublicCountryGuides`,
 * `listPublicRoadmaps`), so this file cannot drift from what /dokumen and
 * /roadmap actually list. Adding a country guide or a roadmap template to the
 * database updates this route within one revalidate window — nobody has to
 * remember it.
 *
 * Hard requirement: NEVER 5xx and never fail a build. Dokploy builds straight
 * off a push to main, so an unreachable Convex during prerender must degrade to
 * the static sections and still return 200. Both queries are settled
 * independently — a failure in one section does not blank the other.
 */

export const revalidate = 3600;
// Route handlers are uncached by default in Next 15; this + `revalidate` opts
// into ISR so the two Convex round-trips happen once an hour, not per request.
export const dynamic = "force-static";

const SITE_URL = "https://careerpack.org";

/** Longest description we inline. llms.txt lines are meant to be one-liners. */
const MAX_DESC = 160;

const HEADER = `# CareerPack

> Starter pack karir berbahasa Indonesia: CV ATS-friendly, ceklis dokumen kerja per negara, roadmap skill, latihan wawancara, dan asisten AI dalam satu akun.

CareerPack adalah aplikasi web gratis untuk menyiapkan dan melacak karir, baik
untuk kerja di dalam negeri maupun ke luar negeri. Di dalamnya ada pembuat CV
ATS-friendly, pelacak lamaran, ceklis dokumen per negara tujuan, roadmap skill
bertahap, simulasi wawancara, portofolio publik, dan asisten AI karir. Seluruh
antarmuka berbahasa Indonesia. Halaman panduan dokumen dan roadmap di bawah
terbuka untuk umum tanpa perlu akun; sisanya berada di balik login.

Catatan penting: panduan dokumen di bawah adalah ceklis umum hasil kurasi, bukan
nasihat hukum atau keimigrasian. Sebagian dokumen ditandai wajib dan sebagian
lagi tambahan. Aturan visa dan ketenagakerjaan berubah — pembaca harus
mengonfirmasi ke kedutaan atau perwakilan resmi negara tujuan.`;

const MAIN_PAGES = `## Halaman Utama

- [Beranda](${SITE_URL}/): Ringkasan seluruh alat CareerPack dan cara memulai gratis.
- [Panduan Dokumen Kerja per Negara](${SITE_URL}/dokumen): Daftar dokumen yang biasa diminta untuk bekerja di tiap negara tujuan, dengan penanda wajib atau tambahan.
- [Roadmap Skill](${SITE_URL}/roadmap): Kumpulan roadmap belajar bertahap per bidang karir, lengkap dengan estimasi jam.
- [Kebijakan Privasi](${SITE_URL}/privacy): Data apa yang disimpan CareerPack dan bagaimana menghapusnya.
- [Syarat Layanan](${SITE_URL}/terms): Aturan penggunaan layanan.`;

/** Squash newlines/whitespace and clip — one markdown line per entry. */
function oneLine(value: unknown): string {
  if (typeof value !== "string") return "";
  const flat = value.replace(/\s+/g, " ").trim();
  if (flat.length <= MAX_DESC) return flat;
  return `${flat.slice(0, MAX_DESC - 1).trimEnd()}…`;
}

function asRows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (row): row is Record<string, unknown> =>
      typeof row === "object" && row !== null,
  );
}

/**
 * `- [label](url): description` — skips rows missing a slug or a label rather
 * than emitting a broken link, and falls back to a generic sentence when the
 * row has no description (both `description` fields are optional in the Convex
 * schema).
 */
function toSection(
  heading: string,
  lines: string[],
): string | null {
  if (lines.length === 0) return null;
  return `## ${heading}\n\n${lines.join("\n")}`;
}

function guideLines(value: unknown): string[] {
  const out: string[] = [];
  for (const row of asRows(value)) {
    const slug = oneLine(row.slug);
    const label = oneLine(row.countryLabel) || oneLine(row.country);
    if (!slug || !label) continue;
    const desc =
      oneLine(row.description) ||
      `Dokumen yang perlu disiapkan untuk bekerja di ${label}.`;
    out.push(`- [${label}](${SITE_URL}/dokumen/${slug}): ${desc}`);
  }
  return out;
}

function roadmapLines(value: unknown): string[] {
  const out: string[] = [];
  for (const row of asRows(value)) {
    const slug = oneLine(row.slug);
    const title = oneLine(row.title);
    if (!slug || !title) continue;
    const desc =
      oneLine(row.description) || `Roadmap belajar bertahap untuk ${title}.`;
    out.push(`- [${title}](${SITE_URL}/roadmap/${slug}): ${desc}`);
  }
  return out;
}

/**
 * Best-effort fetch of both public catalogs. Returns empty arrays on any
 * failure — missing env var, unreachable backend, query not deployed yet.
 */
async function fetchCatalogs(): Promise<{
  guides: unknown;
  roadmaps: unknown;
}> {
  const [guides, roadmaps] = await Promise.all([
    publicContentList((client) =>
      client.query(api.documents.queries.listPublicCountryGuides, {}),
    ),
    publicContentList((client) =>
      client.query(api.roadmap.queries.listPublicRoadmaps, {}),
    ),
  ]);
  return { guides, roadmaps };
}

export async function GET(): Promise<Response> {
  const { guides, roadmaps } = await fetchCatalogs();

  const body = [
    HEADER,
    MAIN_PAGES,
    toSection("Panduan Dokumen Kerja per Negara", guideLines(guides)),
    toSection("Roadmap Skill", roadmapLines(roadmaps)),
  ]
    .filter((section): section is string => Boolean(section))
    .join("\n\n");

  return new Response(`${body}\n`, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
