/**
 * `buildMergePlan` — the orchestrator.
 *
 * Every scalar goes through one classifier, evaluated in this order:
 *   1. the CV said nothing            → NOOP, never touch
 *   2. the CV said something implausible → IGNORED note, never written
 *   3. the stored value is blank       → ADDITION, auto-applied
 *   4. the two agree                   → NOOP
 *   5. otherwise                       → CONFLICT, pre-set to `mine`
 *
 * Step 3 carries the design: `bootstrapUser` writes `location: ""`,
 * `targetRole: ""` and `experienceLevel: ""` for every account and `createCV`
 * seeds `personalInfo` with `""`, so required-but-empty is the majority state.
 * A conflict never auto-resolves to the CV's value — the only way to overwrite
 * real data is an explicit per-field choice.
 */

import type { ParsedResume } from "../../../../convex/_shared/resumeShape";
import { stableHash } from "../../../../convex/_shared/stableHash";
import {
  CAP, checkEmail, checkFullName, checkExperienceLevel, checkPhone, checkUrl,
  eqLoose, eqPhone, eqUrl, isBlank, longText, mintId, norm, shortText,
  type Check,
} from "./normalize";
import {
  GROUP, mergeCertifications, mergeEducation, mergeExperience, mergeLanguages,
  mergeProjects, mergeSkills, unionStrings, uniqueConflictId,
} from "./planArrays";
import type {
  Conflict, ConflictApply, ConflictKind, CVPersonalField, CVPersonalInfo,
  MergeInput, MergePlan, PlanCtx, ProfileField, WritePayload,
} from "./types";

/** `!fullName && !experience?.length && !skills?.length` — the "the AI read
 *  the file and found no CV in it" signal the dialog uses to offer a manual
 *  re-parse instead of building a plan out of nothing. */
export function isEmptyParse(p: ParsedResume): boolean {
  return !p.fullName && !p.experience?.length && !p.skills?.length;
}

type ScalarOutcome =
  | { outcome: "none" }
  | { outcome: "add"; value: string }
  | { outcome: "conflict" };

interface ScalarSpec {
  id: string;
  group: string;
  label: string;
  kind: ConflictKind;
  mine: string | undefined;
  theirs: string | undefined;
  check: (raw: string) => Check;
  eq: (a?: string, b?: string) => boolean;
  apply: (value: string) => ConflictApply;
}

function planScalar(ctx: PlanCtx, spec: ScalarSpec): ScalarOutcome {
  if (isBlank(spec.theirs)) return { outcome: "none" };

  const checked = spec.check(spec.theirs as string);
  if (!checked.ok) {
    ctx.ignored.push({
      id: spec.id,
      group: spec.group,
      label: spec.label,
      detail: `Nilai dari CV diabaikan — ${checked.reason}.`,
    });
    return { outcome: "none" };
  }

  if (!isBlank(spec.mine) && spec.eq(spec.mine, checked.value)) return { outcome: "none" };

  if (checked.note) {
    ctx.ignored.push({
      id: `${spec.id}.dipotong`,
      group: spec.group,
      label: spec.label,
      detail: `Nilai dari CV ${checked.note}.`,
    });
  }

  if (isBlank(spec.mine)) {
    ctx.additions.push({
      id: spec.id,
      group: spec.group,
      label: spec.label,
      detail: checked.value,
    });
    return { outcome: "add", value: checked.value };
  }

  ctx.conflicts.push({
    id: uniqueConflictId(ctx, spec.id),
    group: spec.group,
    label: spec.label,
    kind: spec.kind,
    mine: spec.mine as string,
    theirs: checked.value,
    ambiguous: false,
    apply: spec.apply(checked.value),
  });
  return { outcome: "conflict" };
}

const eqExact = (a?: string, b?: string) => norm(a ?? "") === norm(b ?? "");

function planProfile(input: MergeInput, draft: WritePayload, ctx: PlanCtx): void {
  const mine = input.profile;
  const parsed = input.parsed;

  const write = (field: ProfileField, result: ScalarOutcome) => {
    if (result.outcome === "none") return;
    // Recorded for conflicts too: `applyDecisions` can promote the conflict to
    // a write later, and the drift guard must already have its token by then.
    draft.profileExpect[field] = stableHash(mine?.[field]);
    if (result.outcome === "add") draft.profile[field] = result.value;
  };

  const scalar = (
    field: ProfileField,
    label: string,
    theirs: string | undefined,
    check: (raw: string) => Check,
    eq: (a?: string, b?: string) => boolean,
    kind: ConflictKind = "text",
  ) =>
    write(
      field,
      planScalar(ctx, {
        id: `profile.${field}`,
        group: GROUP.profile,
        label,
        kind,
        mine: mine?.[field],
        theirs,
        check,
        eq,
        apply: (value) => ({ on: "profile", field, value }),
      }),
    );

  scalar("fullName", "Nama lengkap", parsed.fullName, checkFullName, eqLoose);
  scalar("phone", "Telepon", parsed.phone, checkPhone, eqPhone);
  scalar("location", "Lokasi", parsed.location, shortText(CAP.name), eqLoose);
  // `headline` is what a résumé actually prints above the summary; the profile
  // calls the same thing a target role.
  scalar("targetRole", "Target posisi", parsed.headline, shortText(CAP.name), eqLoose);
  scalar("experienceLevel", "Level pengalaman", parsed.experienceLevel, checkExperienceLevel, eqLoose);
  scalar("bio", "Bio", parsed.summary ?? parsed.bio, longText(CAP.bio), eqLoose, "longText");

  planProfileSet(input, draft, ctx, "skills", GROUP.skills, "Skill", "skill");
  planProfileSet(input, draft, ctx, "interests", GROUP.interests, "Minat", "minat");
}

/** Sets never conflict: the union of two lists of skills is simply the truth
 *  about the person, and mine's order and casing survive. */
function planProfileSet(
  input: MergeInput,
  draft: WritePayload,
  ctx: PlanCtx,
  field: "skills" | "interests",
  group: string,
  label: string,
  noun: string,
): void {
  const current = input.profile?.[field] ?? [];
  const { merged, dropped } = unionStrings(current, input.parsed[field] ?? [], CAP.entries, CAP.setEntry);

  if (dropped > 0) {
    ctx.ignored.push({
      id: `profile.${field}.capped`,
      group,
      label,
      detail: `${dropped} ${noun} dilewati (maksimal ${CAP.entries} entri).`,
    });
  }
  if (merged.length === current.length) return;

  draft.profile[field] = merged;
  draft.profileExpect[field] = stableHash(input.profile?.[field]);
  ctx.autoMerges.push({
    id: `profile.${field}`,
    group,
    label,
    detail: `${merged.length - current.length} ${noun} ditambahkan.`,
  });
}

const EMPTY_PERSONAL: CVPersonalInfo = {
  fullName: "", email: "", phone: "", location: "", summary: "",
};

const CARRIED_PERSONAL = ["linkedin", "portfolio", "dateOfBirth", "avatarStorageId", "avatarUrl"] as const;

function planCv(input: MergeInput, draft: WritePayload, ctx: PlanCtx): void {
  const cv = input.cv;
  const create = cv === null;
  const parsed = input.parsed;
  const mine = cv?.personalInfo ?? EMPTY_PERSONAL;

  // Built key-by-key rather than spread so an explicitly-present `undefined`
  // can never reach Convex, which reads one as "delete this column".
  const final: CVPersonalInfo = {
    fullName: mine.fullName,
    email: mine.email,
    phone: mine.phone,
    location: mine.location,
    summary: mine.summary,
  };
  for (const key of CARRIED_PERSONAL) {
    const carried = mine[key];
    if (carried !== undefined) final[key] = carried;
  }

  let changed = false;
  let conflicted = false;

  const scalar = (
    field: CVPersonalField,
    label: string,
    theirs: string | undefined,
    check: (raw: string) => Check,
    eq: (a?: string, b?: string) => boolean,
    kind: ConflictKind = "text",
  ) => {
    const result = planScalar(ctx, {
      id: `cv.personalInfo.${field}`,
      group: GROUP.identity,
      label,
      kind,
      mine: mine[field],
      theirs,
      check,
      eq,
      apply: (value) => ({ on: "cvPersonal", field, value }),
    });
    if (result.outcome === "add") {
      final[field] = result.value;
      changed = true;
    }
    if (result.outcome === "conflict") conflicted = true;
  };

  scalar("fullName", "Nama lengkap", parsed.fullName, checkFullName, eqLoose);
  // The account email is the fallback only when the CV is silent AND the row
  // is empty: `sanitizeCV` drops the entire CV section over a missing `@`.
  scalar(
    "email",
    "Email",
    parsed.email ?? (isBlank(mine.email) ? input.accountEmail : undefined),
    checkEmail,
    eqLoose,
  );
  scalar("phone", "Telepon", parsed.phone, checkPhone, eqPhone);
  scalar("location", "Lokasi", parsed.location, shortText(CAP.name), eqLoose);
  scalar("summary", "Ringkasan", parsed.summary ?? parsed.bio, longText(CAP.summary), eqLoose, "longText");
  scalar("linkedin", "LinkedIn", parsed.linkedin, checkUrl, eqUrl);
  scalar("portfolio", "Portfolio", parsed.portfolio, checkUrl, eqUrl);
  scalar("dateOfBirth", "Tanggal lahir", parsed.dateOfBirth, shortText(CAP.date), eqExact);

  if (create || changed || conflicted) {
    draft.cv.personalInfo = final;
    draft.cvExpect.personalInfo = stableHash(cv?.personalInfo);
  }

  if (create) {
    draft.cv.title = norm(input.fileStem ?? "").slice(0, CAP.name).trim() || "CV Impor";
    draft.cvExpect.title = stableHash(undefined);
  }

  const experience = mergeExperience(ctx, cv?.experience ?? [], parsed.experience ?? []);
  if (create || experience.changed || experience.conflicted) {
    draft.cv.experience = experience.final;
    draft.cvExpect.experience = stableHash(cv?.experience);
  }

  const education = mergeEducation(ctx, cv?.education ?? [], parsed.education ?? []);
  if (create || education.changed || education.conflicted) {
    draft.cv.education = education.final;
    draft.cvExpect.education = stableHash(cv?.education);
  }

  const certifications = mergeCertifications(ctx, cv?.certifications ?? [], parsed.certifications ?? []);
  if (create || certifications.changed || certifications.conflicted) {
    draft.cv.certifications = certifications.final;
    draft.cvExpect.certifications = stableHash(cv?.certifications);
  }

  const projects = mergeProjects(ctx, cv?.projects ?? [], parsed.projects ?? []);
  if (create || projects.changed || projects.conflicted) {
    draft.cv.projects = projects.final;
    draft.cvExpect.projects = stableHash(cv?.projects);
  }

  const skills = mergeSkills(ctx, cv?.skills ?? [], parsed.skills ?? []);
  if (create || skills.changed) {
    draft.cv.skills = skills.final;
    draft.cvExpect.skills = stableHash(cv?.skills);
  }

  const languages = mergeLanguages(ctx, cv?.languages ?? [], parsed.languages ?? []);
  if (create || languages.changed) {
    draft.cv.languages = languages.final;
    draft.cvExpect.languages = stableHash(cv?.languages);
  }
}

export function buildMergePlan(input: MergeInput): MergePlan {
  const conflicts: Conflict[] = [];
  const ctx: PlanCtx = {
    conflicts,
    additions: [],
    autoMerges: [],
    ignored: [],
    mint: input.mintId ?? mintId,
    usedIds: new Set<string>(),
  };

  const draft: WritePayload = {
    profile: {},
    profileExpect: {},
    cvId: input.cv?._id ?? null,
    createCv: input.cv === null,
    cv: {},
    cvExpect: {},
    warnings: [],
  };

  planProfile(input, draft, ctx);
  planCv(input, draft, ctx);

  return {
    draft,
    conflicts,
    additions: ctx.additions,
    autoMerges: ctx.autoMerges,
    ignored: ctx.ignored,
  };
}
