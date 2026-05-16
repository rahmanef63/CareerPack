import { Globe } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Personal-branding slice manifest — exposes the public-page toggle
 * surface + slug + theme picker to the AI agent. Block-level edits
 * (heading/paragraph/link payloads) stay in the slice builder UI —
 * their schema is too wide and order-sensitive for chat-style edits.
 *
 * The agent CAN: turn the public page on/off, set slug, switch theme,
 * toggle "available for hire", set CTA. The agent CANNOT: author
 * blocks. Direct user to `/dashboard/personal-branding` for that.
 */
export const personalBrandingManifest: SliceManifest = {
  id: "personal-branding",
  label: "Personal Branding",
  description: "Halaman publik personal + builder block",
  icon: Globe,

  route: {
    slug: "personal-branding",
    component: () =>
      import("./components/PersonalBrandingView").then((m) => ({ default: m.PersonalBrandingView })),
  },

  nav: {
    placement: "more",
    order: 80,
    href: "/dashboard/personal-branding",
    hue: "from-fuchsia-400 to-fuchsia-600",
  },

  skills: [
    {
      id: "branding.get-status",
      label: "Lihat status halaman publik",
      description:
        "Ambil status halaman publik user (enabled, slug, theme, mode auto/custom, availableForHire). Pakai untuk 'apa status branding saya', 'halaman publik saya aktif?'.",
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
        "Ganti URL slug user (mis. 'budi-frontend'). Slug WAJIB lowercase + huruf/angka/dash + 3-40 karakter. Server cek uniqueness dan reserved-slug list — kalau bentrok akan error. Lebih aman panggil branding.get-status dulu untuk lihat slug saat ini.",
      kind: "mutation",
      cta: "Simpan slug",
      args: {
        slug: {
          type: "string",
          label: "Slug baru (lowercase, no spasi)",
          required: true,
          example: "budi-frontend",
          pattern: "^[a-z][a-z0-9-]{2,39}$",
        },
      },
    },
    {
      id: "branding.set-theme",
      label: "Ganti tema halaman publik",
      description:
        "Set theme layout halaman publik. theme harus salah satu: linktree (stack), bento (grid), magazine (editorial), template-v1, template-v2, template-v3. Pakai untuk 'pakai bento layout', 'ganti ke linktree'.",
      kind: "mutation",
      cta: "Simpan tema",
      args: {
        theme: {
          type: "string",
          label: "Theme (linktree|bento|magazine|template-v1|...)",
          required: true,
          example: "bento",
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
