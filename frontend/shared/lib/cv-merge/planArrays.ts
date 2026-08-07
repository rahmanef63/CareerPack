/**
 * Record matching and set merges for the CV arrays.
 *
 * Element `id` fields are never a match key: `localId()` mints a fresh string
 * on every parse, so keying on it turns every re-upload into a pile of
 * duplicate rows. Records match on business identity instead — and `position`
 * is deliberately NOT part of the experience key, because "Sr. Software
 * Engineer" and "Senior Software Engineer" at the same company and start month
 * are one job.
 */

import type { ParsedResume } from "../../../../convex/_shared/resumeShape";
import {
  CAP, checkUrl, deepEqual, eqLoose, eqUrl, isBlank, nameKey, norm, normText,
  proficiencyFromLabel, setKey, slug, truncateSentence, ym,
} from "./normalize";
import type {
  CVArrayItem, CVArrayName, CVCertification, CVEducation, CVExperience, CVLanguage,
  CVProject, CVSkill, DiffRow, PlanCtx, Side,
} from "./types";

type PExperience = NonNullable<ParsedResume["experience"]>[number];
type PEducation = NonNullable<ParsedResume["education"]>[number];
type PCertification = NonNullable<ParsedResume["certifications"]>[number];
type PProject = NonNullable<ParsedResume["projects"]>[number];
type PLanguage = NonNullable<ParsedResume["languages"]>[number];

export const GROUP = {
  profile: "Profil",
  identity: "Identitas",
  experience: "Pengalaman",
  education: "Pendidikan",
  certifications: "Sertifikat",
  projects: "Proyek",
  skills: "Skill",
  languages: "Bahasa",
  interests: "Minat",
} as const;

/** Result of merging one array: the complete final value plus whether it is
 *  worth sending and whether anything still needs the user. */
export interface ArrayMerge<T> {
  final: T[];
  changed: boolean;
  conflicted: boolean;
}

/** Two parsed rows can share a business key. Suffix rather than collide —
 *  `applyDecisions` looks decisions up by id, so a duplicate would silently
 *  apply one user choice to two records. */
export function uniqueConflictId(ctx: PlanCtx, base: string): string {
  let id = base;
  let n = 2;
  while (ctx.usedIds.has(id)) {
    id = `${base}#${n}`;
    n += 1;
  }
  ctx.usedIds.add(id);
  return id;
}

const capShort = (v: string | undefined, max: number) =>
  isBlank(v) ? "" : norm(v as string).slice(0, max).trim();

const capLong = (v: string | undefined, max: number) => {
  if (isBlank(v)) return "";
  const checked = truncateSentence(v as string, max);
  return checked.ok ? checked.value : "";
};

const capOpt = (v: string | undefined, max: number) => {
  const value = capShort(v, max);
  return value === "" ? undefined : value;
};

const capUrl = (v: string | undefined) => {
  if (isBlank(v)) return undefined;
  const checked = checkUrl(v as string);
  return checked.ok ? checked.value : undefined;
};

/** Blank on mine is filled from theirs under BOTH choices — there is nothing
 *  to choose between a value and no value. */
const pickShort = (mine: string, theirs: string | undefined, side: Side, max: number) => {
  const value = capShort(theirs, max);
  if (value === "") return mine;
  if (isBlank(mine)) return value;
  return side === "theirs" ? value : mine;
};

const pickLong = (mine: string, theirs: string | undefined, side: Side, max: number) => {
  const value = capLong(theirs, max);
  if (value === "") return mine;
  if (isBlank(mine)) return value;
  return side === "theirs" ? value : mine;
};

const pickOpt = (mine: string | undefined, theirs: string | undefined, side: Side, max: number) => {
  const value = pickShort(mine ?? "", theirs, side, max);
  return value === "" ? undefined : value;
};

const pickUrl = (mine: string | undefined, theirs: string | undefined, side: Side) => {
  const value = capUrl(theirs);
  if (value === undefined) return mine === undefined || mine === "" ? undefined : mine;
  if (isBlank(mine)) return value;
  return side === "theirs" ? value : mine;
};

const pickBool = (mine: boolean, theirs: boolean | undefined, side: Side) => {
  if (theirs === undefined) return mine;
  return side === "theirs" ? theirs : mine;
};

/** Union by `setKey`, mine's order and casing preserved. Returns how many
 *  entries were refused so the caller can raise an ignored note — the server
 *  throws on overflow rather than truncating. */
export function unionStrings(
  mine: string[],
  theirs: string[],
  maxEntries: number,
  maxLen: number,
): { merged: string[]; dropped: number } {
  const merged = [...mine];
  const seen = new Set(merged.map(setKey));
  let dropped = 0;
  for (const raw of theirs) {
    const value = capShort(raw, maxLen);
    if (value === "") continue;
    const key = setKey(value);
    if (seen.has(key)) continue;
    if (merged.length >= maxEntries) {
      dropped += 1;
      continue;
    }
    seen.add(key);
    merged.push(value);
  }
  return { merged, dropped };
}

const compact = (rows: (DiffRow | null)[]) => rows.filter((r): r is DiffRow => r !== null);

const diffText = (
  label: string,
  mine: string | undefined,
  theirs: string | undefined,
  eq: (a?: string, b?: string) => boolean = eqLoose,
): DiffRow | null => {
  if (isBlank(theirs) || isBlank(mine) || eq(mine, theirs)) return null;
  return { label, mine: norm(mine as string), theirs: norm(theirs as string) };
};

const diffLong = (label: string, mine: string | undefined, theirs: string | undefined): DiffRow | null => {
  if (isBlank(theirs) || isBlank(mine) || eqLoose(mine, theirs)) return null;
  return { label, mine: normText(mine as string), theirs: normText(theirs as string) };
};

const diffBool = (label: string, mine: boolean, theirs: boolean | undefined): DiffRow | null => {
  if (theirs === undefined || theirs === mine) return null;
  return { label, mine: mine ? "Ya" : "Tidak", theirs: theirs ? "Ya" : "Tidak" };
};

const dash = (...parts: (string | undefined)[]) =>
  parts.filter((p) => !isBlank(p)).map((p) => norm(p as string)).join(" — ");

const joinKey = (a: string, b: string) => (a === "" || b === "" ? "" : `${a}|${b}`);

/** Tier 2 keeps keying when its second half is empty, unlike tier 1 where an
 *  empty half is the signal to fall through. A parse that yields nothing but a
 *  company name has to match the row the previous import built from it —
 *  otherwise "no position, no readable start date" appends a fresh duplicate on
 *  every single re-upload, which is the exact failure this engine exists for. */
const joinKeyLoose = (a: string, b: string) => (a === "" ? "" : `${a}|${b}`);

interface RecordConfig<M extends CVArrayItem & { id: string }, T> {
  array: CVArrayName;
  group: string;
  label: string;
  prefix: string;
  /** "" ⇒ this tier cannot key the row; the parsed side falls through to tier 2. */
  mineKey1: (r: M) => string;
  theirsKey1: (r: T) => string;
  mineKey2: (r: M) => string;
  theirsKey2: (r: T) => string;
  idKey: (r: T) => string;
  sublabel: (r: M) => string;
  summaryMine: (r: M) => string;
  summaryTheirs: (r: T) => string;
  diff: (mine: M, theirs: T) => DiffRow[];
  merge: (mine: M, theirs: T, side: Side) => M;
  create: (theirs: T, id: string) => M;
}

function mergeRecordArray<M extends CVArrayItem & { id: string }, T>(
  ctx: PlanCtx,
  cfg: RecordConfig<M, T>,
  mine: M[],
  theirs: T[],
): ArrayMerge<M> {
  const final: M[] = mine.map((row) => ({ ...row }));
  let changed = false;
  let conflicted = false;
  let dropped = 0;

  theirs.forEach((parsed, i) => {
    const tier1 = cfg.theirsKey1(parsed);
    const key = tier1 === "" ? cfg.theirsKey2(parsed) : tier1;
    const keyOfMine = tier1 === "" ? cfg.mineKey2 : cfg.mineKey1;
    const candidates =
      key === "" ? [] : final.flatMap((row, index) => (keyOfMine(row) === key ? [index] : []));

    if (candidates.length === 0) {
      if (final.length >= CAP.entries) {
        dropped += 1;
        return;
      }
      final.push(cfg.create(parsed, ctx.mint(cfg.prefix, i)));
      changed = true;
      ctx.additions.push({
        id: `cv.${cfg.array}.${cfg.idKey(parsed)}`,
        group: cfg.group,
        label: cfg.label,
        detail: cfg.summaryTheirs(parsed),
      });
      return;
    }

    const index = candidates[0];
    const stored = final[index];
    const rows = cfg.diff(stored, parsed);
    const filled = cfg.merge(stored, parsed, "mine");
    const ambiguous = candidates.length > 1;
    const touched = !deepEqual(filled, stored);

    if (rows.length === 0 && !ambiguous) {
      if (touched) {
        final[index] = filled;
        changed = true;
        ctx.autoMerges.push({
          id: `cv.${cfg.array}.${cfg.idKey(parsed)}`,
          group: cfg.group,
          label: cfg.label,
          detail: cfg.sublabel(stored),
        });
      }
      return;
    }

    final[index] = filled;
    if (touched) changed = true;
    conflicted = true;
    ctx.conflicts.push({
      id: uniqueConflictId(ctx, `cv.${cfg.array}.${cfg.idKey(parsed)}`),
      group: cfg.group,
      label: cfg.label,
      sublabel: cfg.sublabel(stored),
      kind: "record",
      mine: cfg.summaryMine(stored),
      theirs: cfg.summaryTheirs(parsed),
      rows,
      ambiguous,
      apply: {
        on: "cvArray",
        array: cfg.array,
        index,
        value: cfg.merge(stored, parsed, "theirs"),
      },
    });
  });

  if (dropped > 0) {
    ctx.ignored.push({
      id: `cv.${cfg.array}.capped`,
      group: cfg.group,
      label: cfg.label,
      detail: `${dropped} entri dilewati (maksimal ${CAP.entries} entri).`,
    });
  }

  return { final, changed, conflicted };
}

const experienceConfig: RecordConfig<CVExperience, PExperience> = {
  array: "experience",
  group: GROUP.experience,
  label: "Pengalaman kerja",
  prefix: "exp",
  mineKey1: (m) => joinKey(nameKey(m.company), ym(m.startDate)),
  theirsKey1: (t) => joinKey(nameKey(t.company), ym(t.startDate)),
  mineKey2: (m) => joinKeyLoose(nameKey(m.company), nameKey(m.position)),
  theirsKey2: (t) => joinKeyLoose(nameKey(t.company), nameKey(t.position ?? "")),
  idKey: (t) => `${slug(t.company)}|${ym(t.startDate) || slug(t.position ?? "")}`,
  sublabel: (m) => dash(m.company, m.position),
  summaryMine: (m) => dash(m.position, m.startDate, m.current ? "sekarang" : m.endDate),
  summaryTheirs: (t) => dash(t.company, t.position, t.startDate, t.current ? "sekarang" : t.endDate),
  diff: (m, t) =>
    compact([
      diffText("Posisi", m.position, t.position),
      diffText("Tanggal mulai", m.startDate, t.startDate),
      diffText("Tanggal selesai", m.endDate, t.endDate),
      diffBool("Masih bekerja di sini", m.current, t.current),
      diffLong("Deskripsi", m.description, t.description),
    ]),
  merge: (m, t, side) => {
    const row: CVExperience = {
      id: m.id,
      company: pickShort(m.company, t.company, side, CAP.name),
      position: pickShort(m.position, t.position, side, CAP.name),
      startDate: pickShort(m.startDate, t.startDate, side, CAP.date),
      current: pickBool(m.current, t.current, side),
      description: pickLong(m.description, t.description, side, CAP.description),
      achievements: unionStrings(m.achievements, t.achievements ?? [], CAP.entries, CAP.achievement).merged,
    };
    const endDate = pickOpt(m.endDate, t.endDate, side, CAP.date);
    if (endDate !== undefined) row.endDate = endDate;
    return row;
  },
  create: (t, id) => {
    const row: CVExperience = {
      id,
      company: capShort(t.company, CAP.name),
      position: capShort(t.position, CAP.name),
      startDate: capShort(t.startDate, CAP.date),
      current: t.current ?? false,
      description: capLong(t.description, CAP.description),
      achievements: unionStrings([], t.achievements ?? [], CAP.entries, CAP.achievement).merged,
    };
    const endDate = capOpt(t.endDate, CAP.date);
    if (endDate !== undefined) row.endDate = endDate;
    return row;
  },
};

const educationConfig: RecordConfig<CVEducation, PEducation> = {
  array: "education",
  group: GROUP.education,
  label: "Pendidikan",
  prefix: "edu",
  mineKey1: (m) => joinKey(nameKey(m.institution), ym(m.startDate)),
  theirsKey1: (t) => joinKey(nameKey(t.institution), ym(t.startDate)),
  mineKey2: (m) => joinKeyLoose(nameKey(m.institution), nameKey(m.degree)),
  theirsKey2: (t) => joinKeyLoose(nameKey(t.institution), nameKey(t.degree ?? "")),
  idKey: (t) => `${slug(t.institution)}|${ym(t.startDate) || slug(t.degree ?? "")}`,
  sublabel: (m) => dash(m.institution, m.degree),
  summaryMine: (m) => dash(m.degree, m.field, m.startDate, m.endDate),
  summaryTheirs: (t) => dash(t.institution, t.degree, t.field, t.startDate, t.endDate),
  diff: (m, t) =>
    compact([
      diffText("Gelar", m.degree, t.degree),
      diffText("Bidang", m.field, t.field),
      diffText("Tanggal mulai", m.startDate, t.startDate),
      diffText("Tanggal selesai", m.endDate, t.endDate),
      diffText("IPK", m.gpa, t.gpa),
    ]),
  merge: (m, t, side) => {
    const row: CVEducation = {
      id: m.id,
      institution: pickShort(m.institution, t.institution, side, CAP.name),
      degree: pickShort(m.degree, t.degree, side, CAP.name),
      field: pickShort(m.field, t.field, side, CAP.name),
      startDate: pickShort(m.startDate, t.startDate, side, CAP.date),
      endDate: pickShort(m.endDate, t.endDate, side, CAP.date),
    };
    const gpa = pickOpt(m.gpa, t.gpa, side, CAP.gpa);
    if (gpa !== undefined) row.gpa = gpa;
    return row;
  },
  create: (t, id) => {
    const row: CVEducation = {
      id,
      institution: capShort(t.institution, CAP.name),
      degree: capShort(t.degree, CAP.name),
      field: capShort(t.field, CAP.name),
      startDate: capShort(t.startDate, CAP.date),
      endDate: capShort(t.endDate, CAP.date),
    };
    const gpa = capOpt(t.gpa, CAP.gpa);
    if (gpa !== undefined) row.gpa = gpa;
    return row;
  },
};

const certificationConfig: RecordConfig<CVCertification, PCertification> = {
  array: "certifications",
  group: GROUP.certifications,
  label: "Sertifikat",
  prefix: "cert",
  mineKey1: (m) => joinKey(nameKey(m.name), nameKey(m.issuer)),
  theirsKey1: (t) => joinKey(nameKey(t.name), nameKey(t.issuer ?? "")),
  mineKey2: (m) => nameKey(m.name),
  theirsKey2: (t) => nameKey(t.name),
  idKey: (t) => (isBlank(t.issuer) ? slug(t.name) : `${slug(t.name)}|${slug(t.issuer as string)}`),
  sublabel: (m) => dash(m.name, m.issuer),
  summaryMine: (m) => dash(m.issuer, m.date),
  summaryTheirs: (t) => dash(t.name, t.issuer, t.date),
  diff: (m, t) =>
    compact([
      diffText("Penerbit", m.issuer, t.issuer),
      diffText("Tanggal", m.date, t.date),
      diffText("Kedaluwarsa", m.expiryDate, t.expiryDate),
    ]),
  merge: (m, t, side) => {
    const row: CVCertification = {
      id: m.id,
      name: pickShort(m.name, t.name, side, CAP.name),
      issuer: pickShort(m.issuer, t.issuer, side, CAP.name),
      date: pickShort(m.date, t.date, side, CAP.date),
    };
    const expiryDate = pickOpt(m.expiryDate, t.expiryDate, side, CAP.date);
    if (expiryDate !== undefined) row.expiryDate = expiryDate;
    return row;
  },
  create: (t, id) => {
    const row: CVCertification = {
      id,
      name: capShort(t.name, CAP.name),
      issuer: capShort(t.issuer, CAP.name),
      date: capShort(t.date, CAP.date),
    };
    const expiryDate = capOpt(t.expiryDate, CAP.date);
    if (expiryDate !== undefined) row.expiryDate = expiryDate;
    return row;
  },
};

const projectConfig: RecordConfig<CVProject, PProject> = {
  array: "projects",
  group: GROUP.projects,
  label: "Proyek",
  prefix: "proj",
  mineKey1: (m) => nameKey(m.name),
  theirsKey1: (t) => nameKey(t.name),
  // Only one tier: a project has no second identity field, and matching on
  // description would fork the row every time the AI rephrases it.
  mineKey2: () => "",
  theirsKey2: () => "",
  idKey: (t) => slug(t.name),
  sublabel: (m) => norm(m.name),
  summaryMine: (m) => dash(m.description, m.link),
  summaryTheirs: (t) => dash(t.name, t.description, t.link),
  diff: (m, t) =>
    compact([
      diffLong("Deskripsi", m.description, t.description),
      diffText("Tautan", m.link, t.link, eqUrl),
    ]),
  merge: (m, t, side) => {
    const row: CVProject = {
      id: m.id,
      name: pickShort(m.name, t.name, side, CAP.name),
      description: pickLong(m.description, t.description, side, CAP.description),
      technologies: unionStrings(m.technologies, t.technologies ?? [], CAP.entries, CAP.technology).merged,
    };
    const link = pickUrl(m.link, t.link, side);
    if (link !== undefined) row.link = link;
    return row;
  },
  create: (t, id) => {
    const row: CVProject = {
      id,
      name: capShort(t.name, CAP.name),
      description: capLong(t.description, CAP.description),
      technologies: unionStrings([], t.technologies ?? [], CAP.entries, CAP.technology).merged,
    };
    const link = capUrl(t.link);
    if (link !== undefined) row.link = link;
    return row;
  },
};

export const mergeExperience = (ctx: PlanCtx, mine: CVExperience[], theirs: PExperience[]) =>
  mergeRecordArray(ctx, experienceConfig, mine, theirs);

export const mergeEducation = (ctx: PlanCtx, mine: CVEducation[], theirs: PEducation[]) =>
  mergeRecordArray(ctx, educationConfig, mine, theirs);

export const mergeCertifications = (ctx: PlanCtx, mine: CVCertification[], theirs: PCertification[]) =>
  mergeRecordArray(ctx, certificationConfig, mine, theirs);

export const mergeProjects = (ctx: PlanCtx, mine: CVProject[], theirs: PProject[]) =>
  mergeRecordArray(ctx, projectConfig, mine, theirs);

/**
 * Skills are a set, never a conflict: an existing row keeps its `category`
 * and `proficiency` because the user tuned those by hand and the CV cannot
 * know them.
 */
export function mergeSkills(ctx: PlanCtx, mine: CVSkill[], theirs: string[]): ArrayMerge<CVSkill> {
  const final: CVSkill[] = mine.map((row) => ({ ...row }));
  const seen = new Set(final.map((row) => setKey(row.name)));
  let added = 0;
  let dropped = 0;

  theirs.forEach((raw, i) => {
    const name = capShort(raw, CAP.setEntry);
    if (name === "") return;
    const key = setKey(name);
    if (seen.has(key)) return;
    if (final.length >= CAP.entries) {
      dropped += 1;
      return;
    }
    seen.add(key);
    final.push({
      id: ctx.mint("skill", i),
      name,
      category: "General",
      proficiency: proficiencyFromLabel(),
    });
    added += 1;
  });

  if (dropped > 0) {
    ctx.ignored.push({
      id: "cv.skills.capped",
      group: GROUP.skills,
      label: "Skill di CV",
      detail: `${dropped} skill dilewati (maksimal ${CAP.entries} entri).`,
    });
  }
  if (added > 0) {
    ctx.autoMerges.push({
      id: "cv.skills",
      group: GROUP.skills,
      label: "Skill di CV",
      detail: `${added} skill ditambahkan.`,
    });
  }
  return { final, changed: added > 0, conflicted: false };
}

/**
 * Languages are a set too, and a language already listed keeps its stored
 * proficiency even when the CV disagrees — deliberate: "Menengah" from a
 * self-reported CV is not better information than what the user typed.
 */
export function mergeLanguages(ctx: PlanCtx, mine: CVLanguage[], theirs: PLanguage[]): ArrayMerge<CVLanguage> {
  const final: CVLanguage[] = mine.map((row) => ({ ...row }));
  const seen = new Set(final.map((row) => setKey(row.language)));
  let added = 0;
  let dropped = 0;

  for (const row of theirs) {
    const language = capShort(row.language, CAP.setEntry);
    if (language === "") continue;
    const key = setKey(language);
    if (seen.has(key)) continue;
    if (final.length >= CAP.entries) {
      dropped += 1;
      continue;
    }
    seen.add(key);
    final.push({
      language,
      proficiency: capShort(row.proficiency, CAP.proficiencyLabel) || "Menengah",
    });
    added += 1;
  }

  if (dropped > 0) {
    ctx.ignored.push({
      id: "cv.languages.capped",
      group: GROUP.languages,
      label: "Bahasa",
      detail: `${dropped} bahasa dilewati (maksimal ${CAP.entries} entri).`,
    });
  }
  if (added > 0) {
    ctx.autoMerges.push({
      id: "cv.languages",
      group: GROUP.languages,
      label: "Bahasa",
      detail: `${added} bahasa ditambahkan.`,
    });
  }
  return { final, changed: added > 0, conflicted: false };
}
