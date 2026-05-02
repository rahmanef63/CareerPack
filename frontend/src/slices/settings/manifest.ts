import { Settings as SettingsIcon } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Settings slice manifest — owns user-facing profile editing
 * (name, phone, location, target role, bio, skills, etc.) and
 * preference panels.
 *
 * AI skills here perform surgical patches via `api.profile.mutations.
 * patchProfile`. Each skill maps 1:1 to a profile field. The
 * binder (`SettingsCapabilities`) lives in the slice and subscribes
 * to the bus on mount.
 */
export const settingsManifest: SliceManifest = {
  id: "settings",
  label: "Pengaturan",
  description: "Profil pribadi, preferensi, integrasi",
  icon: SettingsIcon,

  route: {
    slug: "settings",
    component: () =>
      import("./components/SettingsView").then((m) => ({ default: m.SettingsView })),
  },

  nav: {
    placement: "more",
    order: 95,
    href: "/dashboard/settings",
    hue: "from-slate-500 to-slate-700",
  },

  skills: [
    {
      id: "settings.update-phone",
      label: "Update nomor telepon",
      description:
        "Ubah nomor telepon di profil pengguna. Format Indonesia atau internasional.",
      slashCommand: "/phone",
      kind: "mutation",
      cta: "Simpan",
      args: {
        phone: {
          type: "string",
          label: "Nomor telepon",
          required: true,
          example: "081234567890",
          pattern: "^[+\\d\\s()-]{6,30}$",
        },
      },
      argsFromText: (rest) => {
        const phone = rest.trim();
        if (!phone) return null;
        if (!/^[+\d\s()-]{6,30}$/.test(phone)) return null;
        return { phone };
      },
    },
    {
      id: "settings.update-target-role",
      label: "Update target role",
      description:
        "Ubah peran/jabatan yang sedang dicari pengguna (mis. Frontend Engineer).",
      slashCommand: "/target",
      kind: "mutation",
      cta: "Simpan",
      args: {
        targetRole: {
          type: "string",
          label: "Target role",
          required: true,
          example: "Backend Engineer",
        },
      },
      argsFromText: (rest) => {
        const targetRole = rest.trim();
        if (!targetRole || targetRole.length > 120) return null;
        return { targetRole };
      },
    },
    {
      id: "settings.update-location",
      label: "Update lokasi",
      description: "Ubah lokasi pengguna (kota + negara).",
      slashCommand: "/lokasi",
      kind: "mutation",
      cta: "Simpan",
      args: {
        location: {
          type: "string",
          label: "Lokasi",
          required: true,
          example: "Jakarta, Indonesia",
        },
      },
      argsFromText: (rest) => {
        const location = rest.trim();
        if (!location || location.length > 120) return null;
        return { location };
      },
    },
    {
      id: "settings.update-bio",
      label: "Update bio profil",
      description: "Ubah ringkasan singkat profil (1-3 kalimat).",
      slashCommand: "/bio",
      kind: "mutation",
      cta: "Simpan",
      args: {
        bio: {
          type: "string",
          label: "Bio",
          required: true,
          example: "Backend engineer dengan 3 tahun pengalaman …",
        },
      },
      argsFromText: (rest) => {
        const bio = rest.trim();
        if (!bio || bio.length > 600) return null;
        return { bio };
      },
    },
  ],
};
