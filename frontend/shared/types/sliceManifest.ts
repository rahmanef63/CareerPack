import type { LucideIcon } from "lucide-react";

/**
 * Slice manifest — declarative AI-capability descriptor per feature
 * slice.
 *
 * Scope is the AI agent ONLY. The central `sliceRegistry` imports each
 * slice's manifest and derives the AI skill catalog (slash commands,
 * approval-card meta, LLM system-prompt brief).
 *
 * Routing and navigation are NOT driven by this manifest. Live routing
 * is owned by `DASHBOARD_VIEWS` in `shared/lib/dashboardRoutes.tsx`
 * (the `/dashboard/[[...slug]]` catch-all) and nav by `PRIMARY_NAV` /
 * `MORE_APPS` in `shared/components/layout/navConfig.ts`. See CLAUDE.md
 * "Adding a dashboard page" for the two edits that wire a new view.
 *
 * To expose AI skills for a slice: drop a `manifest.ts` in the slice
 * folder, add ONE import line in `shared/lib/sliceRegistry.ts`, and the
 * slice's `skills` become invokable by the agent.
 *
 * The slice may also export a `Capabilities` component that subscribes
 * to the aiActionBus and runs each declared skill via local hooks.
 * Mounting is centralized in `Providers.tsx`.
 */
export interface SliceManifest {
  /** Stable kebab-case ID. Doubles as the skill prefix
   *  (e.g. id="settings" → skill "settings.update-phone"). */
  id: string;
  /** Human-facing label (id locale). Used in the AI skill list. */
  label: string;
  /** One-line summary. Used in AI tooltips. */
  description: string;
  /** Lucide icon for AI skill chips. */
  icon: LucideIcon;

  /** AI capabilities exposed by this slice. Empty array = no AI skills. */
  skills?: SliceSkill[];
}

export interface SliceSkill {
  /** Stable globally-unique ID, conventionally `<sliceId>.<verb-noun>`.
   *  Doubles as the action.type emitted onto aiActionBus. */
  id: string;
  /** Short label for the AI to call this by (UI + LLM-facing). */
  label: string;
  /** What this skill does. Shown to user on approval card AND fed to
   *  the LLM so it knows when to invoke. Be specific. */
  description: string;
  /** Slash trigger ("/phone"). Optional — some skills are LLM-only.
   *  Slash commands are matched case-insensitively. */
  slashCommand?: string;
  /** Argument schema. Used to render approval form, validate AI output,
   *  and brief the LLM about expected payload. */
  args?: SkillArgSchema;
  /** What kind of operation — drives default icon + UX copy.
   *  - "mutation": writes data; needs approval.
   *  - "navigate": pure router push; auto-applied is OK.
   *  - "query": read-only fetch + render; no approval needed.
   *  - "compose": creates new entity (CV, roadmap node). */
  kind: "mutation" | "navigate" | "query" | "compose";
  /** Apply-button label. Default: "Terapkan". */
  cta?: string;
  /** Optional client-side parser: when user types `<slashCommand> <rest>`,
   *  extract structured payload. Return null on parse failure (skill not
   *  invoked). If absent, no slash invocation — skill is LLM-only. */
  argsFromText?: (rest: string) => Record<string, unknown> | null;
}

/**
 * JSON-schema-lite for skill arguments. Each entry describes one field
 * the AI must populate. Used to:
 * 1. Render the approval form (per-field input).
 * 2. Tell the LLM what arguments the action takes.
 * 3. Generate examples in the slash popover.
 */
export type SkillArgSchema = Record<string, SkillArgField>;

export interface SkillArgField {
  type: "string" | "number" | "boolean" | "string[]";
  /** id-locale label rendered next to the input. */
  label: string;
  /** Mark required for both AI-side validation and form-side. */
  required?: boolean;
  /** Example value rendered in slash popover + LLM brief. */
  example?: string;
  /** Optional regex. Used for client-side validation only — server
   *  always re-validates. Phone numbers, emails, URLs. */
  pattern?: string;
}

/**
 * Wire-format envelope for invoking a skill from the AI agent.
 * Generic — the bus does not know skill-specific payload shapes;
 * the binder resolves them via the manifest at runtime.
 */
export interface SkillAction<P = Record<string, unknown>> {
  type: string; // skill.id
  payload: P;
}
