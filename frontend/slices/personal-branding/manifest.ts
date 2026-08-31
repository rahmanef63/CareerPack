import { Globe } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Personal-branding slice manifest — exposes the public-page toggle surface +
 * slug + theme picker to the in-app AI agent.
 *
 * The agent CAN: turn the public page on/off, set slug, switch template,
 * toggle "available for hire". It canNOT author the page's HTML through the
 * general chat/tool-calling loop — that stays an MCP-connector job
 * (convex/mcp/tools/branding.ts) or the dedicated, single-purpose
 * `api.ai.branding.generateBrandingHtml` action wired into
 * `CustomHtmlCard`'s "Generate dengan AI" button. Both write against the
 * same marker contract (convex/profile/brandingMarkers.ts) and only ever
 * return a draft for the user to review — neither can reach `publicHtml`
 * through a chat turn.
 */
export const personalBrandingManifest: SliceManifest = {
  id: "personal-branding",
  label: "Personal Branding",
  description: "Halaman publik personal — template atau HTML sendiri",
  icon: Globe,

  skills: [
    {
      id: "branding.get-status",
      label: "Lihat status halaman publik",
      description:
        "Ambil status halaman publik user (enabled, slug, theme, availableForHire). Pakai untuk 'apa status branding saya', 'halaman publik saya aktif?'.",
      kind: "query",
    },
    {
      id: "branding.toggle-public",
      label: "Aktif/non-aktifkan halaman publik",
      description:
        "Set publicEnabled. enabled=true akan publish ke /<slug>; enabled=false unpublish (slug tetap reserved). Pakai untuk 'aktifkan halaman publik saya', 'matikan personal page'.",
      kind: "mutation",
      cta: "Simpan status",
      args: {
        enabled: { type: "boolean", label: "Aktifkan?", required: true },
      },
    },
    {
      id: "branding.set-slug",
      label: "Ganti slug halaman publik",
      description:
        "Ganti URL slug user (mis. 'budi-frontend'). Slug WAJIB lowercase + huruf/angka/dash + 3-30 karakter. Server cek uniqueness dan reserved-slug list — kalau bentrok akan error. Lebih aman panggil branding.get-status dulu untuk lihat slug saat ini.",
      kind: "mutation",
      cta: "Simpan slug",
      args: {
        slug: {
          type: "string",
          label: "Slug baru (lowercase, no spasi)",
          required: true,
          example: "budi-frontend",
          pattern: "^[a-z][a-z0-9-]{1,28}[a-z0-9]$",
        },
      },
    },
    {
      id: "branding.set-theme",
      label: "Ganti tema halaman publik",
      description:
        "Set template halaman publik. theme harus salah satu: starter (bersih, satu kolom), template-v1 (Purple Glass), template-v2 (Editorial Cream), template-v3 (Premium Dark). Pakai untuk 'ganti template', 'pakai yang dark'.",
      kind: "mutation",
      cta: "Simpan tema",
      args: {
        theme: {
          type: "string",
          label: "Template (starter|template-v1|template-v2|template-v3)",
          required: true,
          example: "starter",
        },
      },
    },
    {
      id: "branding.set-available",
      label: "Set status open-for-work",
      description:
        "Toggle badge 'Available for hire' di hero halaman publik + note pendek (≤80 char). Pakai untuk 'aku open buat senior frontend Q3', 'matikan badge open'.",
      kind: "mutation",
      cta: "Simpan status",
      args: {
        availableForHire: {
          type: "boolean",
          label: "Open for hire?",
          required: true,
        },
        availabilityNote: {
          type: "string",
          label: "Catatan (mis. 'Open senior frontend Q3 2026')",
          required: false,
        },
      },
    },
  ],
};
