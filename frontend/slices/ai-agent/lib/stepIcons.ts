import {
  Wrench,
  Sparkles,
  BookOpen,
  Brain,
  CheckCheck,
  Cog,
  type LucideIcon,
} from "lucide-react";
import type { StepType } from "../types/progress";

/** Icon shown next to each step in the progress accordion. */
export const STEP_ICON: Record<StepType, LucideIcon> = {
  resolve_config: Wrench,
  resolve_skill: Sparkles,
  load_context: BookOpen,
  inference: Brain,
  finalize: CheckCheck,
};

/** Fallback icon when the backend emits a step type the client
 *  doesn't yet know about — keeps forward-compat painless. */
export const FALLBACK_STEP_ICON: LucideIcon = Cog;

export function iconForStep(type: string): LucideIcon {
  return STEP_ICON[type as StepType] ?? FALLBACK_STEP_ICON;
}
