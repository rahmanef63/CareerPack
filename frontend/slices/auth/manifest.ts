import { LogIn } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Auth slice — login + register flow on `/login`. Public, no AI surface
 * (logout via agent would be a footgun; user must click the menu).
 *
 * Registered for completeness so the central registry covers every
 * slice; no skills, no dashboard nav.
 */
export const authManifest: SliceManifest = {
  id: "auth",
  label: "Login",
  description: "Halaman login + register",
  icon: LogIn,
};
