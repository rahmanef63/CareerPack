/**
 * Types for the CV-import merge engine.
 *
 * The engine diffs a `ParsedResume` against the user's stored `userProfiles`
 * row and default `cvs` row and returns a plan: a complete "everything stays
 * at mine" write payload plus the list of genuine conflicts the user still
 * has to resolve. Nothing here touches React, Convex, the DOM, `Date.now()`
 * or `Math.random()` — the purity is what makes the whole thing testable in
 * `environment: "node"`.
 */

import type { ParsedResume } from "../../../../convex/_shared/resumeShape";

export type Side = "mine" | "theirs";
export type CVArrayName =
  | "experience" | "education" | "skills"
  | "certifications" | "languages" | "projects";
export type ConflictKind = "text" | "longText" | "record";

export type ProfileField =
  | "fullName" | "phone" | "location" | "targetRole" | "experienceLevel" | "bio";
export type CVPersonalField =
  | "fullName" | "email" | "phone" | "location" | "summary"
  | "linkedin" | "portfolio" | "dateOfBirth";

export interface CVPersonalInfo {
  fullName: string; email: string; phone: string; location: string; summary: string;
  linkedin?: string; portfolio?: string; dateOfBirth?: string;
  avatarStorageId?: string; avatarUrl?: string;
}
export interface CVExperience {
  id: string; company: string; position: string; startDate: string;
  endDate?: string; current: boolean; description: string; achievements: string[];
}
export interface CVEducation {
  id: string; institution: string; degree: string; field: string;
  startDate: string; endDate: string; gpa?: string;
}
export interface CVSkill { id: string; name: string; category: string; proficiency: number }
export interface CVCertification {
  id: string; name: string; issuer: string; date: string; expiryDate?: string;
}
/** The ONLY array element with no `id`. Never synthesise one — `validateCVUpdates`
 *  spreads the row through the `cvs` validator, which rejects extra keys. */
export interface CVLanguage { language: string; proficiency: string }
export interface CVProject {
  id: string; name: string; description: string; technologies: string[]; link?: string;
}
export type CVArrayItem =
  | CVExperience | CVEducation | CVSkill | CVCertification | CVLanguage | CVProject;

export interface CurrentProfile {
  fullName?: string; phone?: string; location?: string; targetRole?: string;
  experienceLevel?: string; bio?: string; skills?: string[]; interests?: string[];
}
export interface CurrentCV {
  _id: string; title: string; personalInfo: CVPersonalInfo;
  experience: CVExperience[]; education: CVEducation[]; skills: CVSkill[];
  certifications: CVCertification[]; languages: CVLanguage[]; projects: CVProject[];
}

export interface MergeInput {
  profile: CurrentProfile | null;
  cv: CurrentCV | null;
  /** `users.email` — seeds `cv.personalInfo.email` when the CV has none. */
  accountEmail?: string;
  /** Uploaded filename without extension → title of a newly created CV. */
  fileStem?: string;
  parsed: ParsedResume;
  /** Deterministic id minter. Default: (p, i) => `${p}-imp-${i}`. Tests inject their own. */
  mintId?: (prefix: string, index: number) => string;
}

export type ConflictApply =
  | { on: "profile";    field: ProfileField;     value: string }
  | { on: "cvPersonal"; field: CVPersonalField;  value: string }
  | { on: "cvArray";    array: CVArrayName; index: number; value: CVArrayItem };

/** One differing field inside a `kind: "record"` conflict. */
export interface DiffRow { label: string; mine: string; theirs: string }

export interface Conflict {
  /** Stable and derived from content, so the same CV re-uploaded produces the
   *  same ids: "profile.bio", "cv.experience.pt-tokopedia|2020-03". */
  id: string;
  group: string;
  label: string;
  sublabel?: string;
  kind: ConflictKind;
  mine: string;
  theirs: string;
  rows?: DiffRow[];
  /** The parsed row matched more than one stored row. */
  ambiguous: boolean;
  apply: ConflictApply;
}

export interface Note { id: string; group: string; label: string; detail?: string }

export interface WritePayload {
  /** ONLY keys that change. NEVER contains an explicit `undefined`. */
  profile: Record<string, string | string[]>;
  /** `stableHash` of the value the client believed was stored, per key in `profile`. */
  profileExpect: Record<string, string>;
  cvId: string | null;
  createCv: boolean;
  /** Complete final arrays / complete `personalInfo` — `updateCV` replaces both wholesale. */
  cv: {
    title?: string;
    personalInfo?: CVPersonalInfo;
    experience?: CVExperience[]; education?: CVEducation[]; skills?: CVSkill[];
    certifications?: CVCertification[]; languages?: CVLanguage[]; projects?: CVProject[];
  };
  cvExpect: Record<string, string>;
  warnings: string[];
}

export interface MergePlan {
  /** The "everything at mine" outcome, already complete. */
  draft: WritePayload;
  conflicts: Conflict[];
  additions: Note[];
  autoMerges: Note[];
  /** Dropped values and the reason — implausible, over cap, truncated. */
  ignored: Note[];
}

/** Mutable accumulator threaded through the planners. */
export interface PlanCtx {
  conflicts: Conflict[];
  additions: Note[];
  autoMerges: Note[];
  ignored: Note[];
  mint: (prefix: string, index: number) => string;
  /** Conflict ids already handed out, so two parsed rows with the same
   *  business key cannot collide into one card. */
  usedIds: Set<string>;
}
