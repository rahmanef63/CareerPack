import { HelpCircle } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Help slice — FAQ + feature guides + shortcuts + feedback form.
 * The agent can submit feedback on the user's behalf (`help.submit-
 * feedback`). FAQ content is static so no read-side skill is needed —
 * the agent already has access to project docs in its system prompt.
 */
export const helpManifest: SliceManifest = {
  id: "help",
  label: "Pusat Bantuan",
  description: "FAQ, panduan fitur, shortcut, kirim feedback",
  icon: HelpCircle,

  route: {
    slug: "help",
    component: () =>
      import("./components/HelpView").then((m) => ({ default: m.HelpView })),
  },

  nav: {
    placement: "more",
    order: 95,
    href: "/dashboard/help",
    hue: "from-teal-400 to-teal-600",
  },

  skills: [
    {
      id: "help.submit-feedback",
      label: "Kirim feedback",
      description:
        "Kirim feedback user ke admin (subject 1-100 char, message 5-2000 char). Pakai saat user bilang 'kirim feedback', 'laporkan bug', 'kasih saran'.",
      kind: "mutation",
      cta: "Kirim feedback",
      args: {
        subject: {
          type: "string",
          label: "Subjek (1-100 karakter)",
          required: true,
          example: "Bug di kalender",
        },
        message: {
          type: "string",
          label: "Pesan (5-2000 karakter)",
          required: true,
        },
      },
    },
  ],
};
