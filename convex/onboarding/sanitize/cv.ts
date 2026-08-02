import {
  asBool, asISODate, asInt, asString, asStringArray, asYearMonth,
  isHttpUrl, localId, optString, pickString,
} from "./primitives";

export interface SanitizedCV {
  title: string;
  template: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
    linkedin?: string;
    portfolio?: string;
    dateOfBirth?: string;
  };
  experience: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa?: string;
  }>;
  skills: Array<{
    id: string;
    name: string;
    category: string;
    proficiency: number;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
  }>;
  languages: Array<{ language: string; proficiency: string }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }>;
  isDefault: boolean;
}

/** Drop-counts surfaced by sanitizeCV so the orchestrator can warn the
 *  user when sub-arrays were silently filtered to empty. */
export interface CVDropCounts {
  experience: number;
  education: number;
  skills: number;
  certifications: number;
  languages: number;
  projects: number;
}

export function sanitizeCV(
  raw: unknown,
): { cv: SanitizedCV; dropped: CVDropCounts } | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  // AIs use a wide variety of containers for the same identity fields.
  const piRaw = (r.personalInfo ?? {}) as Record<string, unknown>;
  const personalRaw = (r.personal ?? {}) as Record<string, unknown>;
  const infoRaw = (r.info ?? {}) as Record<string, unknown>;
  const contactRaw = (r.contact ?? {}) as Record<string, unknown>;
  const basicsRaw = (r.basics ?? {}) as Record<string, unknown>;
  const headerRaw = (r.header ?? {}) as Record<string, unknown>;
  const profileRaw = (r.profile ?? {}) as Record<string, unknown>;
  const containers = [piRaw, personalRaw, infoRaw, contactRaw, basicsRaw, headerRaw, profileRaw];

  function fromAny(...keys: string[]): unknown[] {
    const out: unknown[] = [];
    for (const c of containers) {
      for (const k of keys) out.push((c as Record<string, unknown>)[k]);
    }
    for (const k of keys) out.push(r[k]);
    return out;
  }

  const fullName = pickString(fromAny("fullName", "name", "displayName"), 120);
  const email = pickString(fromAny("email", "emailAddress", "mail"), 120);
  if (!fullName || !email) return null;
  const phone = pickString(fromAny("phone", "phoneNumber", "tel", "mobile"), 30) ?? "";
  const location = pickString(fromAny("location", "address", "city"), 120) ?? "";
  const summary = pickString(
    fromAny("summary", "bio", "about", "objective", "headline"),
    1500,
  ) ?? "";

  const sanitizeArray = <T>(
    src: unknown,
    fn: (x: unknown) => T | null,
    cap: number,
  ): { items: T[]; dropped: number } => {
    if (!Array.isArray(src)) return { items: [], dropped: 0 };
    const items: T[] = [];
    let dropped = 0;
    for (const raw of src) {
      const cleaned = fn(raw);
      if (cleaned) items.push(cleaned);
      else dropped++;
      if (items.length >= cap) break;
    }
    return { items, dropped };
  };

  const firstArray = (...keys: string[]): unknown => {
    for (const k of keys) {
      const v = r[k];
      if (Array.isArray(v) && v.length > 0) return v;
    }
    return undefined;
  };
  const exp = sanitizeArray(
    firstArray("experience", "experiences", "work", "workExperience", "employment"),
    sanitizeExperience, 30,
  );
  const edu = sanitizeArray(
    firstArray("education", "educations", "schools", "academic"),
    sanitizeEducation, 15,
  );
  const sk = sanitizeArray(
    firstArray("skills", "skill", "skillSet", "competencies"),
    sanitizeCVSkill, 60,
  );
  const cert = sanitizeArray(
    firstArray("certifications", "certificates", "certs"),
    sanitizeCertification, 30,
  );
  const lang = sanitizeArray(
    firstArray("languages", "language", "spokenLanguages"),
    sanitizeLanguage, 10,
  );
  const proj = sanitizeArray(
    firstArray("projects", "project", "portfolio", "works"),
    sanitizeProject, 30,
  );

  return {
    cv: {
      title: asString(r.title, 120) ?? "CV",
      template: asString(r.template, 30) ?? "modern",
      personalInfo: {
        fullName, email, phone, location, summary,
        linkedin: isHttpUrl(piRaw.linkedin) ?? isHttpUrl(r.linkedin),
        portfolio: isHttpUrl(piRaw.portfolio) ?? isHttpUrl(r.portfolio),
        dateOfBirth: asISODate(piRaw.dateOfBirth) ?? asISODate(r.dateOfBirth),
      },
      experience: exp.items, education: edu.items,
      skills: sk.items, certifications: cert.items,
      languages: lang.items, projects: proj.items,
      isDefault: false,
    },
    dropped: {
      experience: exp.dropped, education: edu.dropped,
      skills: sk.dropped, certifications: cert.dropped,
      languages: lang.dropped, projects: proj.dropped,
    },
  };
}

function sanitizeExperience(raw: unknown): SanitizedCV["experience"][number] | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const company =
    asString(r.company, 120) ?? asString(r.employer, 120) ??
    asString(r.organization, 120) ?? asString(r.org, 120);
  const position =
    asString(r.position, 120) ?? asString(r.role, 120) ??
    asString(r.title, 120) ?? asString(r.jobTitle, 120);
  const startDate =
    asYearMonth(r.startDate) ?? asYearMonth(r.start) ??
    asYearMonth(r.from) ?? asYearMonth(r.startYear);
  if (!company || !position || !startDate) return null;
  const current = asBool(r.current ?? r.isCurrent ?? r.present);
  const endDate = current
    ? undefined
    : asYearMonth(r.endDate) ?? asYearMonth(r.end) ??
      asYearMonth(r.to) ?? asYearMonth(r.endYear);
  let achievementsRaw: unknown = r.achievements ?? r.highlights ?? r.bullets;
  if (typeof achievementsRaw === "string") {
    achievementsRaw = achievementsRaw
      .split(/\r?\n|•|·/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return {
    id: localId("exp"),
    company, position, startDate, endDate, current,
    description: asString(r.description, 2000) ?? asString(r.summary, 2000) ?? "",
    achievements: asStringArray(achievementsRaw, 10, 300),
  };
}

function sanitizeEducation(raw: unknown): SanitizedCV["education"][number] | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const institution =
    asString(r.institution, 200) ?? asString(r.school, 200) ??
    asString(r.university, 200) ?? asString(r.college, 200);
  if (!institution) return null;
  return {
    id: localId("edu"),
    institution,
    degree: asString(r.degree, 60) ?? asString(r.qualification, 60) ?? "",
    field:
      asString(r.field, 120) ?? asString(r.fieldOfStudy, 120) ??
      asString(r.major, 120) ?? asString(r.area, 120) ?? "",
    startDate:
      asYearMonth(r.startDate) ?? asYearMonth(r.start) ?? asYearMonth(r.from) ?? "",
    endDate:
      asYearMonth(r.endDate) ?? asYearMonth(r.end) ?? asYearMonth(r.to) ?? "",
    gpa: optString(r.gpa, 10),
  };
}

function sanitizeCVSkill(raw: unknown): SanitizedCV["skills"][number] | null {
  if (typeof raw === "string") {
    const name = asString(raw, 60);
    if (!name) return null;
    return { id: localId("s"), name, category: "General", proficiency: 70 };
  }
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = asString(r.name, 60) ?? asString(r.skill, 60) ?? asString(r.title, 60);
  if (!name) return null;
  let proficiency = asInt(r.proficiency, 0, 100);
  if (proficiency === null) {
    const lvl = asInt(r.proficiency, 1, 5);
    if (lvl !== null) proficiency = lvl * 20;
  }
  if (proficiency === null) {
    const lbl = typeof r.proficiency === "string" ? r.proficiency.trim().toLowerCase() : "";
    const map: Record<string, number> = {
      beginner: 30, basic: 40, intermediate: 60,
      menengah: 60, mahir: 80, advanced: 85, expert: 95, ahli: 95, native: 100,
    };
    if (map[lbl]) proficiency = map[lbl];
  }
  return {
    id: localId("s"),
    name,
    category: asString(r.category, 60) ?? "General",
    proficiency: proficiency ?? 70,
  };
}

function sanitizeCertification(raw: unknown): SanitizedCV["certifications"][number] | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = asString(r.name, 200);
  if (!name) return null;
  return {
    id: localId("cert"),
    name,
    issuer: asString(r.issuer, 200) ?? "",
    date: asISODate(r.date) ?? "",
    expiryDate: asISODate(r.expiryDate),
  };
}

function sanitizeLanguage(raw: unknown): SanitizedCV["languages"][number] | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const language = asString(r.language, 60);
  const proficiency = asString(r.proficiency, 30);
  if (!language || !proficiency) return null;
  return { language, proficiency };
}

function sanitizeProject(raw: unknown): SanitizedCV["projects"][number] | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = asString(r.name, 200);
  if (!name) return null;
  return {
    id: localId("p"),
    name,
    description: asString(r.description, 1000) ?? "",
    technologies: asStringArray(r.technologies, 20, 60),
    link: isHttpUrl(r.link),
  };
}
