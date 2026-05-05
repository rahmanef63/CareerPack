import { Map as MapIcon } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Skill-roadmap slice manifest — owns `skillRoadmaps` + `roadmapSaved`
 * via the AI agent. The agent can browse public templates, start a
 * roadmap from a slug, and tick off progress. Heavy seed flow lives
 * server-side in `roadmap.mutations.startFromTemplate` so the binder
 * stays a thin one-shot dispatcher.
 */
export const skillRoadmapManifest: SliceManifest = {
  id: "skill-roadmap",
  label: "Skill Roadmap",
  description: "Roadmap belajar untuk capai target karir",
  icon: MapIcon,

  route: {
    slug: "roadmap",
    component: () =>
      import("./components/SkillRoadmap").then((m) => ({ default: m.SkillRoadmap })),
  },

  nav: {
    placement: "more",
    order: 30,
    href: "/dashboard/roadmap",
    hue: "from-sky-400 to-sky-600",
  },

  skills: [
    {
      id: "roadmap.list",
      label: "Lihat roadmap saya",
      description:
        "Ambil roadmap aktif user (careerPath, progress %, daftar skill dengan id+name+status). Pakai DULU sebelum update-progress / toggle-resource untuk dapat skillId yang valid. Returns null kalau user belum punya roadmap aktif.",
      kind: "query",
    },
    {
      id: "roadmap.list-templates",
      label: "Lihat template roadmap publik",
      description:
        "Ambil daftar template roadmap publik (slug, judul, domain, jumlah node, total jam). Pakai untuk menjawab 'roadmap apa yang ada' / sebelum start-from-template untuk dapat slug yang valid.",
      kind: "query",
    },
    {
      id: "roadmap.start-from-template",
      label: "Mulai roadmap dari template",
      description:
        "Buat roadmap aktif baru dari template slug. Menggantikan roadmap aktif sebelumnya kalau ada. Slug harus persis sama dengan slug template publik (panggil roadmap.list-templates dulu kalau ragu). Pakai untuk 'mulai roadmap React', 'set roadmap saya jadi data-engineer'.",
      kind: "compose",
      cta: "Mulai roadmap",
      args: {
        slug: {
          type: "string",
          label: "Slug template (mis. 'frontend-react')",
          required: true,
          example: "frontend-react",
        },
      },
    },
    {
      id: "roadmap.update-progress",
      label: "Update status skill",
      description:
        "Ubah status 1 skill di roadmap aktif. status WAJIB salah satu dari: not-started, in-progress, completed. Pakai untuk 'tandai React selesai', 'mulai belajar TypeScript'. WAJIB punya skillId dari roadmap.list.",
      kind: "mutation",
      cta: "Simpan progress",
      args: {
        skillId: {
          type: "string",
          label: "Skill ID (dari roadmap.list)",
          required: true,
        },
        status: {
          type: "string",
          label: "Status (not-started|in-progress|completed)",
          required: true,
          example: "completed",
        },
      },
    },
    {
      id: "roadmap.toggle-resource",
      label: "Tandai resource selesai/belum",
      description:
        "Toggle status completed pada 1 resource learning di skill. Berguna untuk 'sudah baca artikel X', 'selesai course Y'. resourceTitle harus persis sama dengan title resource di roadmap.",
      kind: "mutation",
      cta: "Update resource",
      args: {
        skillId: { type: "string", label: "Skill ID", required: true },
        resourceTitle: {
          type: "string",
          label: "Judul resource (persis sama)",
          required: true,
        },
        completed: {
          type: "boolean",
          label: "Tandai selesai?",
          required: true,
        },
      },
    },
    {
      id: "roadmap.reset",
      label: "Reset roadmap",
      description:
        "Hapus roadmap aktif user. Bookmark template di 'Skill Saya' tetap; user bisa start ulang nanti. Aksi destructive — perlu persetujuan user.",
      kind: "mutation",
      cta: "Reset roadmap",
    },
  ],
};
