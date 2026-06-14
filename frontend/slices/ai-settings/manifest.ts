import { Settings2 } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * AI Settings slice — per-user provider config (model, base URL,
 * API key). Sensitive — API key writes do NOT go through the AI
 * agent. Read-only `ai.get-config` skill lets the agent answer
 * "what model am I using" without exposing the key (handler strips).
 */
export const aiSettingsManifest: SliceManifest = {
  id: "ai-settings",
  label: "AI Settings",
  description: "Konfigurasi provider AI per-user",
  icon: Settings2,

  skills: [
    {
      id: "ai.get-config",
      label: "Lihat konfigurasi AI saya",
      description:
        "Ambil provider + model aktif user (tanpa apiKey). Pakai untuk 'pakai model apa', 'provider AI saya apa'.",
      kind: "query",
    },
  ],
};
