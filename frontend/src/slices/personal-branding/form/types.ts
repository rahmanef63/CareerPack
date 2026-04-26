/**
 * FormState — single source of truth for the Personal Branding builder.
 *
 * Adding a new editable field is 4 surgical touches:
 *   1. Add the key to FormState here.
 *   2. Add a default to ./defaults.ts.
 *   3. Hydrate it from server data in ./usePBForm.ts → seedFromServer.
 *   4. Use it in the section that owns it.
 *
 * Every section uses the same `Bind` API (see below) so a section
 * never needs to know about the other 19 fields — only the ones it
 * binds to its own inputs.
 */

import type {
  Block,
  HeaderBg,
  PersonalBrandingTheme,
} from "../blocks/types";
import type { AutoToggles } from "../../../../../convex/profile/autoBlocks";

export type Mode = "auto" | "custom";

export interface FormState {
  // ---- identity ----------------------------------------------------
  enabled: boolean;
  slug: string;
  headline: string;

  // ---- hero opt-in toggles ----------------------------------------
  avatarShow: boolean;
  bioShow: boolean;
  skillsShow: boolean;
  targetRoleShow: boolean;
  portfolioShow: boolean;

  // ---- contact ----------------------------------------------------
  contactEmail: string;
  linkedinUrl: string;
  portfolioUrl: string;

  // ---- discovery --------------------------------------------------
  allowIndex: boolean;

  // ---- builder ----------------------------------------------------
  mode: Mode;
  theme: PersonalBrandingTheme;
  headerBg: HeaderBg | null;
  autoToggles: AutoToggles;
  blocks: Block[];

  // ---- share & export (opt-in per-format) -------------------------
  htmlExport: boolean;
  embedExport: boolean;
  promptExport: boolean;
}

export type FieldKey = keyof FormState;

/**
 * Bind one field. Returns {value, onChange} matching the shape of
 * shadcn primitives (Input, Switch, Select, etc.). TypeScript narrows
 * the value to the exact field type via the K generic, so the
 * onChange callback is type-safe per field.
 */
export type Bind = <K extends FieldKey>(key: K) => {
  value: FormState[K];
  onChange: (v: FormState[K]) => void;
};

/**
 * Imperative setter — for fields that aren't bound to a single input
 * (e.g. setting the whole `headerBg` object from a sub-picker).
 */
export type SetField = <K extends FieldKey>(
  key: K,
  value: FormState[K],
) => void;

export interface SlugValidation {
  ok: boolean;
  message?: string;
}

export interface SubmitOptions {
  /** When true, force enabled=true regardless of the local toggle. */
  activate?: boolean;
}

/**
 * Per-section override props. Every section accepts these on top of
 * `bind` so callers can rebrand / reuse the components without
 * forking — useful for opensource derivatives.
 */
export interface SectionOverrides {
  title?: string;
  description?: string;
  className?: string;
}
