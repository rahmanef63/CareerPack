/**
 * Agent progress types — shape of the timeline the chat backend
 * returns alongside its reply. Strictly slice-internal: only the
 * AI Agent console renders this. Promote to @/shared/types if a
 * second slice ever needs to display agent runs.
 */

export type StepType =
  | "resolve_config"
  | "resolve_skill"
  | "load_context"
  | "inference"
  | "finalize";

export type StepStatus =
  | "pending"
  | "running"
  | "completed"
  | "skipped"
  | "error";

export interface AIStep {
  id: string;
  type: StepType;
  status: StepStatus;
  /** Short label rendered next to the step icon. */
  label: string;
  /** Optional one-line elaboration ("Sumber: global · model: …"). */
  detail?: string;
  /** Wall-clock ms spent in this step. Server-measured. */
  durationMs?: number;
  /** Populated when status === "error". */
  error?: string;
}

export interface AIProgress {
  steps: AIStep[];
  totalDurationMs: number;
  isComplete: boolean;
}
