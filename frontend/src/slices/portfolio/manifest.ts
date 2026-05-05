import { Folder } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Portfolio slice manifest — owns `portfolioItems` table CRUD via the
 * AI agent. The agent can list, create, delete, toggle-featured. Heavy
 * media operations (gallery upload, multi-link forms) stay in the
 * slice UI because they need file pickers; AI sticks to text-only
 * fields. Multiple link/media support flows through `portfolio.update`
 * once we expose it (deferred — payload is too wide for chat).
 */
export const portfolioManifest: SliceManifest = {
  id: "portfolio",
  label: "Portofolio",
  description: "Showcase project + sertifikasi + publikasi",
  icon: Folder,

  route: {
    slug: "portfolio",
    component: () =>
      import("./components/PortfolioView").then((m) => ({ default: m.PortfolioView })),
  },

  nav: {
    placement: "more",
    order: 70,
    href: "/dashboard/portfolio",
    hue: "from-orange-400 to-orange-600",
  },

  skills: [
    {
      id: "portfolio.list",
      label: "Lihat portfolio items",
      description:
        "Ambil semua item portfolio user (itemId, title, category, description, featured, date). Pakai DULU sebelum delete/toggle butuh itemId.",
      kind: "query",
    },
    {
      id: "portfolio.create",
      label: "Tambah item portfolio",
      description:
        "Buat 1 item portfolio baru (text-only fields). Category WAJIB salah satu dari: project, certification, publication, design, writing, speaking, award, openSource, volunteer, music, photography, teaching, research, video, other. Date format bebas tapi disarankan YYYY-MM atau YYYY.",
      kind: "compose",
      cta: "Buat item",
      args: {
        title: { type: "string", label: "Judul project/sertifikat", required: true, example: "Sertifikasi AWS" },
        description: { type: "string", label: "Deskripsi singkat", required: true },
        category: {
          type: "string",
          label: "Kategori (project|certification|publication|...)",
          required: true,
          example: "project",
        },
        date: { type: "string", label: "Tanggal/tahun", required: true, example: "2026-04" },
        link: { type: "string", label: "URL utama (opsional)", required: false },
      },
    },
    {
      id: "portfolio.delete",
      label: "Hapus item portfolio",
      description:
        "Hapus 1 item portfolio berdasarkan itemId. Aksi destructive — perlu approval.",
      kind: "mutation",
      cta: "Hapus item",
      args: {
        itemId: { type: "string", label: "ID item", required: true },
      },
    },
    {
      id: "portfolio.toggle-featured",
      label: "Toggle featured portfolio",
      description:
        "Toggle flag featured pada 1 item — featured = true akan di-promote ke atas grid + jadi default di public branding page. Pakai untuk 'pin item ini', 'tonjolkan project X'.",
      kind: "mutation",
      cta: "Toggle featured",
      args: {
        itemId: { type: "string", label: "ID item", required: true },
      },
    },
  ],
};
