import { Sparkles } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Hero slice — landing page on `/`. Public marketing surface, no
 * dashboard nav, no AI skills. Registered so the slice registry
 * tracks every slice the codebase declares.
 */
export const heroManifest: SliceManifest = {
  id: "hero",
  label: "Landing",
  description: "Landing page publik",
  icon: Sparkles,
};
