import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Slice manifest — single source of truth per feature slice.
 *
 * Replaces three parallel registries (navConfig, dashboardRoutes,
 * slash-command list) with one declarative file per slice. The central
 * `sliceRegistry` imports each slice's manifest and exposes derived
 * views: nav primary/more, route resolver, AI skill catalog.
 *
 * To add a new slice: drop a `manifest.ts` in the slice folder, then
 * add ONE import line in `shared/lib/sliceRegistry.ts`. The new slice
 * automatically appears in nav (per `nav.placement`), is routable
 * (per `route`), and its AI skills become invokable.
 *
 * The slice may also export a `Capabilities` component that subscribes
 * to the aiActionBus and runs each declared skill via local hooks.
 * Mounting is centralized in `Providers.tsx`.
 */
export interface SliceManifest {
  /** Stable kebab-case ID. Doubles as nav id, route slug, and skill
   *  prefix (e.g. id="settings" → skill "settings.update-phone"). */
  id: string;
  /** Human-facing label (id locale). Used in nav + AI skill list. */
  label: string;
  /** One-line summary. Used in More-drawer tile + AI tooltip. */
  description: string;
  /** Lucide icon for nav + AI skill chips. */
  icon: LucideIcon;

  /** Routing — null/undefined means slice is non-routable (capability-only). */
  route?: SliceRoute;

  /** Navigation placement. */
  nav?: SliceNav;

  /** AI capabilities exposed by this slice. Empty array = no AI skills. */
  skills?: SliceSkill[];
}

export interface SliceRoute {
  /** First slash-segment under /dashboard/. Must match `id` for the
   *  ResponsiveContainer's catch-all to resolve. */
  slug: string;
  /** Lazy-loaded React component for this route. */
  component: () => Promise<{ default: ComponentType<unknown> }>;
}

export interface SliceNav {
  /** Where this slice appears.
   *  - "primary" — bottom nav tab (mobile) + sidebar primary (desktop). Max 4.
   *  - "more" — More drawer (mobile) + secondary sidebar (desktop).
   *  - "hidden" — registered but not shown (e.g. AI agent FAB, admin gates). */
  placement: "primary" | "more" | "hidden";
  /** Sort within placement, ascending. Lower = earlier. */
  order: number;
  /** Pathname. Default: `/dashboard/${id}`. Override only when slice owns
   *  a non-standard URL (e.g. dashboard-home owns "/dashboard"). */
  href?: string;
  /** Tailwind gradient class for More-drawer tiles, e.g.
   *  "from-emerald-400 to-emerald-600". */
  hue?: string;
  /** Optional badge ("AI", "Beta"). */
  badge?: string;
  /** Hide unless explicit gate (super-admin etc.). Server enforces too. */
  superAdminOnly?: boolean;
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
