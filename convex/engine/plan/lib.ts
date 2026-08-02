/**
 * Plan Compiler validator — pure JS, enforces a controlled action
 * vocabulary on the LLM output. Anything outside the enum or beyond
 * the per-quest action cap gets dropped, so a misbehaving model
 * cannot inject arbitrary side-effects through the planner.
 */

export const ALLOWED_ACTION_TYPES = [
  "study_skill",
  "add_roadmap_node",
  "tailor_cv",
  "subscribe_listings",
  "set_calendar_block",
  "report_outcome",
  "prepare_documents",
  "generic",
] as const;

export type AllowedActionType = (typeof ALLOWED_ACTION_TYPES)[number];

const ALLOWED_SET = new Set<string>(ALLOWED_ACTION_TYPES);

export interface RawAction {
  type?: unknown;
  label?: unknown;
  payload?: unknown;
}

export interface ValidatedAction {
  id: string;
  type: AllowedActionType;
  label: string;
  payload: unknown;
  completed: boolean;
}

export interface RawPlan {
  title?: unknown;
  etaMonths?: unknown;
  actions?: unknown;
}

export interface ValidatedPlan {
  title: string;
  etaMonths: number;
  actions: ValidatedAction[];
}

const MAX_TITLE_LEN = 120;
const MAX_LABEL_LEN = 200;
const MAX_ACTIONS = 12;
const MIN_ETA = 1;
const MAX_ETA = 60;

/**
 * Coerce + filter the LLM-emitted JSON into a strictly-validated
 * plan shape. Returns null when nothing rescuable is present.
 */
export function validatePlan(raw: RawPlan): ValidatedPlan | null {
  const title =
    typeof raw.title === "string" && raw.title.trim().length > 0
      ? raw.title.trim().slice(0, MAX_TITLE_LEN)
      : null;
  if (!title) return null;

  const etaRaw = Number(raw.etaMonths);
  const etaMonths = Number.isFinite(etaRaw)
    ? Math.max(MIN_ETA, Math.min(MAX_ETA, Math.round(etaRaw)))
    : 12;

  const actionsArr = Array.isArray(raw.actions) ? raw.actions : [];
  const validatedActions: ValidatedAction[] = [];

  for (const a of actionsArr) {
    if (!a || typeof a !== "object") continue;
    const cand = a as RawAction;
    if (typeof cand.type !== "string") continue;
    if (!ALLOWED_SET.has(cand.type)) continue;
    if (typeof cand.label !== "string" || cand.label.trim().length === 0) {
      continue;
    }
    validatedActions.push({
      id: `act-${validatedActions.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
      type: cand.type as AllowedActionType,
      label: cand.label.trim().slice(0, MAX_LABEL_LEN),
      payload: cand.payload ?? null,
      completed: false,
    });
    if (validatedActions.length >= MAX_ACTIONS) break;
  }

  if (validatedActions.length === 0) return null;

  return { title, etaMonths, actions: validatedActions };
}
